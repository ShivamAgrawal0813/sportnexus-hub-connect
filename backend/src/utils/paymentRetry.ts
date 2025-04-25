import Payment from '../models/Payment';
import getStripeInstance from '../config/stripe';
import Booking from '../models/Booking';
import logger from './logger';

interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 60000,    // 60 seconds
  backoffFactor: 2    // Exponential backoff
};

/**
 * Calculate delay for next retry attempt using exponential backoff
 */
const calculateBackoff = (attempt: number, options: RetryOptions): number => {
  const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt);
  return Math.min(delay, options.maxDelay);
};

/**
 * Retry a failed Stripe payment
 */
export const retryStripePayment = async (paymentId: string, options: Partial<RetryOptions> = {}): Promise<boolean> => {
  const retryOptions = { ...defaultRetryOptions, ...options };
  
  try {
    logger.info('Starting payment retry process', { paymentId });
    
    // Get the payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      logger.error('Payment not found for retry', { paymentId });
      return false;
    }
    
    // Check if payment is eligible for retry
    if (payment.status !== 'failed' || !payment.stripePaymentId) {
      logger.warn('Payment not eligible for retry', { paymentId, status: payment.status });
      return false;
    }
    
    // Get Stripe instance
    const stripe = getStripeInstance();
    if (!stripe) {
      logger.error('Stripe not configured for retry');
      return false;
    }
    
    // Retrieve the original payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentId);
    
    // Check if it's already succeeded (unlikely but possible)
    if (paymentIntent.status === 'succeeded') {
      logger.info('Payment already succeeded, updating records', { paymentId });
      await Payment.findByIdAndUpdate(paymentId, { status: 'completed' });
      
      // Update booking if exists
      if (payment.booking) {
        await Booking.findByIdAndUpdate(payment.booking, {
          paymentStatus: 'paid',
          status: 'confirmed'
        });
      }
      
      return true;
    }
    
    // If payment is already being processed, don't retry
    if (paymentIntent.status === 'processing') {
      logger.info('Payment is currently processing, skipping retry', { paymentId });
      return false;
    }
    
    // Attempt to retry the payment
    for (let attempt = 0; attempt < retryOptions.maxRetries; attempt++) {
      try {
        logger.info('Attempting payment retry', { paymentId, attempt: attempt + 1 });
        
        // Create a new payment intent since the original one failed
        const newIntent = await stripe.paymentIntents.create({
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method as string,
          customer: paymentIntent.customer as string,
          metadata: paymentIntent.metadata,
          confirm: true, // Automatically confirm the payment
          off_session: true // Process the payment without customer interaction
        });
        
        // If successful, update records
        if (newIntent.status === 'succeeded') {
          logger.info('Retry payment succeeded', { paymentId, newPaymentIntentId: newIntent.id });
          
          // Update payment record
          await Payment.findByIdAndUpdate(paymentId, {
            status: 'completed',
            stripePaymentId: newIntent.id, // Update to new payment intent ID
            metadata: {
              ...payment.metadata,
              retriedFrom: payment.stripePaymentId,
              retryAttempt: attempt + 1
            }
          });
          
          // Update booking if exists
          if (payment.booking) {
            await Booking.findByIdAndUpdate(payment.booking, {
              paymentStatus: 'paid',
              status: 'confirmed'
            });
          }
          
          return true;
        }
        
        // If still requires action, we can't proceed without the customer
        if (newIntent.status === 'requires_action') {
          logger.warn('Retry requires customer action, can\'t proceed', { paymentId });
          return false;
        }
        
        // Wait before next retry
        const delay = calculateBackoff(attempt, retryOptions);
        logger.debug('Waiting before next retry attempt', { delay, attempt: attempt + 1 });
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Payment retry attempt failed', { paymentId, attempt: attempt + 1, error: errorMessage });
        
        // Stripe returned an error suggesting we should not retry
        if (error instanceof Error && 
            (errorMessage.includes('authentication_required') || 
             errorMessage.includes('card_declined') ||
             errorMessage.includes('expired_card'))) {
          logger.warn('Card error detected, stopping retry attempts', { error: errorMessage });
          return false;
        }
        
        // Wait before next retry
        const delay = calculateBackoff(attempt, retryOptions);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    logger.warn('All payment retry attempts failed', { paymentId, attempts: retryOptions.maxRetries });
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error in payment retry process', { paymentId, error: errorMessage });
    return false;
  }
};

/**
 * Schedule automated retries for recent failed payments
 */
export const scheduleFailedPaymentRetries = async (): Promise<void> => {
  try {
    // Find recent failed payments (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const failedPayments = await Payment.find({
      status: 'failed',
      stripePaymentId: { $exists: true, $ne: null },
      updatedAt: { $gte: oneDayAgo },
      'metadata.retryAttempted': { $ne: true } // Only retry payments that haven't been retried
    });
    
    logger.info(`Found ${failedPayments.length} failed payments to retry`);
    
    // Process each failed payment
    for (const payment of failedPayments) {
      // Mark as retry attempted to prevent duplicate retries
      await Payment.findByIdAndUpdate(payment._id, {
        'metadata.retryAttempted': true
      });
      
      // Retry the payment
      await retryStripePayment(payment._id.toString());
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error scheduling payment retries', { error: errorMessage });
  }
};

export default {
  retryStripePayment,
  scheduleFailedPaymentRetries
}; 