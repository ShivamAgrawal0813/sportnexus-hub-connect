import { Request, Response } from 'express';
import getStripeInstance from '../config/stripe';
import Payment from '../models/Payment';
import Booking from '../models/Booking';
import { createPaymentIntent, processWalletPayment, addFundsToWallet } from '../utils/paymentService';
import logger from '../utils/logger';

// Create a payment intent (for Stripe)
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { amount, currency, bookingId, paymentMethod, discountCode } = req.body;
    logger.info('Payment request received', { amount, currency, bookingId, paymentMethod, discountCode });
    
    if (!amount || !currency || !paymentMethod) {
      logger.warn('Missing required payment fields', { amount, currency, paymentMethod });
      return res.status(400).json({
        success: false,
        message: 'Amount, currency, and payment method are required',
      });
    }
    
    if (!req.user) {
      logger.warn('Unauthenticated payment attempt');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    
    // If booking ID is provided, verify it exists and belongs to user
    if (bookingId) {
      logger.debug('Verifying booking ownership', { bookingId, userId });
      const booking = await Booking.findOne({ _id: bookingId, user: userId });
      
      if (!booking) {
        logger.warn('Booking not found or does not belong to user', { bookingId, userId });
        return res.status(404).json({
          success: false,
          message: 'Booking not found or does not belong to user',
        });
      }
      logger.debug('Booking verified', { bookingId });
    }
    
    // Process based on payment method
    if (paymentMethod === 'stripe') {
      logger.info('Processing Stripe payment', { amount, currency });
      
      // Check if Stripe is configured
      const stripe = getStripeInstance();
      if (!stripe) {
        logger.error('Stripe not configured');
        return res.status(500).json({
          success: false,
          message: 'Stripe is not configured properly',
        });
      }
      
      const result = await createPaymentIntent({
        amount,
        currency,
        userId,
        bookingId,
        paymentMethod,
        discountCode,
      });
      
      logger.info('Payment intent result', { success: result.success });
      return res.status(result.success ? 200 : 400).json(result);
    } else if (paymentMethod === 'wallet') {
      logger.info('Processing wallet payment', { amount, currency });
      const result = await processWalletPayment({
        amount,
        currency,
        userId,
        bookingId,
        description: `Payment for booking ${bookingId}`,
      });
      
      logger.info('Wallet payment result', { success: result.success });
      return res.status(result.success ? 200 : 400).json(result);
    } else {
      logger.warn('Unsupported payment method', { paymentMethod });
      return res.status(400).json({
        success: false,
        message: 'Unsupported payment method',
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Payment creation error', { error: errorMessage });
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing payment',
      error: errorMessage,
    });
  }
};

// Handle Stripe webhook
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const stripe = getStripeInstance();
  if (!stripe) {
    logger.error('Stripe not configured for webhook processing');
    return res.status(500).json({
      success: false,
      message: 'Stripe is not configured properly',
    });
  }

  const sig = req.headers['stripe-signature'];
  
  if (!sig || typeof sig !== 'string') {
    logger.warn('Missing or invalid Stripe signature in webhook request');
    return res.status(400).json({
      success: false, 
      message: 'Stripe signature is missing or invalid'
    });
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('Stripe webhook secret is not configured');
      return res.status(500).json({
        success: false,
        message: 'Stripe webhook secret is not configured'
      });
    }
    
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
    
    logger.info('Stripe webhook event received', { eventType: event.type });
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;
    }
    
    res.json({ received: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Webhook processing error', { error: errorMessage });
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
};

// Get user's payment history
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      logger.warn('Unauthenticated access attempt to payment history');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    logger.debug('Retrieving payment history', { userId });
    
    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('booking', 'date status');
    
    logger.debug('Payment history retrieved', { userId, count: payments.length });
    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error retrieving payment history', { error: errorMessage });
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history',
      error: errorMessage,
    });
  }
};

// Process refund
export const processRefund = async (req: Request, res: Response) => {
  try {
    const { paymentId, reason } = req.body;
    logger.info('Refund request received', { paymentId });
    
    if (!paymentId) {
      logger.warn('Missing payment ID in refund request');
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
    }
    
    if (!req.user) {
      logger.warn('Unauthenticated refund attempt');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    // Only admins can process refunds
    if (req.user.role !== 'admin') {
      logger.warn('Non-admin user attempted to process refund', { userId: req.user.id });
      return res.status(403).json({
        success: false,
        message: 'Only administrators can process refunds',
      });
    }
    
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      logger.warn('Payment not found for refund', { paymentId });
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }
    
    if (payment.status === 'refunded') {
      logger.warn('Attempted to refund already refunded payment', { paymentId });
      return res.status(400).json({
        success: false,
        message: 'Payment has already been refunded',
      });
    }
    
    // Process refund based on payment method
    if (payment.paymentMethod === 'stripe' && payment.stripePaymentId) {
      logger.info('Processing Stripe refund', { paymentId, stripePaymentId: payment.stripePaymentId });
      const stripe = getStripeInstance();
      if (!stripe) {
        logger.error('Stripe not configured for refund processing');
        return res.status(500).json({
          success: false,
          message: 'Stripe is not configured properly',
        });
      }

      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
      });
      
      // Update payment status
      payment.status = 'refunded';
      payment.refundReason = reason || 'Refund requested by admin';
      await payment.save();
      
      logger.info('Stripe refund processed successfully', { paymentId, refundId: refund.id });
      return res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        refund,
      });
    } else if (payment.paymentMethod === 'wallet') {
      logger.info('Processing wallet refund', { paymentId });
      // For wallet payments, add the amount back to the user's wallet
      const { success, wallet } = await addFundsToWallet(
        payment.user instanceof Object ? payment.user.toString() : String(payment.user),
        payment.amount,
        payment.currency,
        payment._id instanceof Object ? payment._id.toString() : String(payment._id)
      );
      
      if (success) {
        // Update payment status
        payment.status = 'refunded';
        payment.refundReason = reason || 'Refund requested by admin';
        await payment.save();
        
        logger.info('Wallet refund processed successfully', { paymentId, walletId: wallet._id });
        return res.status(200).json({
          success: true,
          message: 'Refund processed successfully to user wallet',
          wallet,
        });
      } else {
        logger.error('Failed to process wallet refund', { paymentId });
        return res.status(500).json({
          success: false,
          message: 'Failed to process refund to wallet',
        });
      }
    } else {
      logger.warn('Unsupported payment method for refund', { paymentId, paymentMethod: payment.paymentMethod });
      return res.status(400).json({
        success: false,
        message: 'Unsupported payment method for refund',
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Refund processing error', { error: errorMessage });
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the refund',
      error: errorMessage,
    });
  }
};

// Helper functions
const handleSuccessfulPayment = async (paymentIntent: any) => {
  try {
    logger.info('Processing successful payment', { paymentIntentId: paymentIntent.id });
    const { userId, bookingId } = paymentIntent.metadata;
    
    if (!userId) {
      logger.error('Missing userId in payment intent metadata', { paymentIntentId: paymentIntent.id });
      return;
    }
    
    logger.debug('Payment metadata received', { userId, bookingId });
    
    // Update the payment status in our database
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentId: paymentIntent.id },
      { status: 'completed' },
      { new: true }
    );
    
    if (!payment) {
      logger.error('Payment record not found for Stripe payment', { paymentIntentId: paymentIntent.id });
      return;
    }
    
    logger.debug('Payment status updated', { paymentId: payment._id });
    
    // If there's a booking associated, update its payment status
    if (bookingId) {
      logger.debug('Updating booking status', { bookingId });
      const booking = await Booking.findByIdAndUpdate(
        bookingId, 
        { 
          paymentStatus: 'paid',
          status: 'confirmed', 
        },
        { new: true }
      );
      
      if (!booking) {
        logger.error('Booking not found for payment', { bookingId });
      } else {
        logger.info('Booking updated successfully', { bookingId });
      }
    }
  } catch (error) {
    logger.error('Error handling successful payment', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

const handleFailedPayment = async (paymentIntent: any) => {
  try {
    logger.info('Processing failed payment', { paymentIntentId: paymentIntent.id });
    
    // Update the payment status in our database
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentId: paymentIntent.id },
      { status: 'failed' },
      { new: true }
    );
    
    if (!payment) {
      logger.error('Payment record not found for failed Stripe payment', { paymentIntentId: paymentIntent.id });
      return;
    }
    
    logger.debug('Payment status updated to failed', { paymentId: payment._id });
    
    // Update booking status if applicable
    const { bookingId } = paymentIntent.metadata;
    
    if (bookingId) {
      logger.debug('Updating booking payment status to failed', { bookingId });
      const booking = await Booking.findByIdAndUpdate(
        bookingId, 
        { paymentStatus: 'failed' },
        { new: true }
      );
      
      if (!booking) {
        logger.error('Booking not found for failed payment', { bookingId });
      } else {
        logger.info('Booking payment status updated to failed', { bookingId });
      }
    }
  } catch (error) {
    logger.error('Error handling failed payment', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}; 