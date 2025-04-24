import { Request, Response } from 'express';
import getStripeInstance from '../config/stripe';
import Payment from '../models/Payment';
import Booking from '../models/Booking';
import { createPaymentIntent, processWalletPayment, addFundsToWallet } from '../utils/paymentService';

// Create a payment intent (for Stripe)
export const createPayment = async (req: Request, res: Response) => {
  try {
    console.log('Payment request received:', JSON.stringify(req.body, null, 2));
    
    const { amount, currency, bookingId, paymentMethod, discountCode } = req.body;
    
    console.log('Payment parameters:', { amount, currency, bookingId, paymentMethod, discountCode });
    
    if (!amount || !currency || !paymentMethod) {
      console.error('Missing required fields:', { amount, currency, paymentMethod });
      return res.status(400).json({
        success: false,
        message: 'Amount, currency, and payment method are required',
      });
    }
    
    if (!req.user) {
      console.error('User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    console.log('User authenticated:', req.user.id);
    const userId = req.user.id;
    
    // If booking ID is provided, verify it exists and belongs to user
    if (bookingId) {
      console.log('Verifying booking:', bookingId);
      const booking = await Booking.findOne({ _id: bookingId, user: userId });
      
      if (!booking) {
        console.error('Booking not found or does not belong to user:', bookingId);
        return res.status(404).json({
          success: false,
          message: 'Booking not found or does not belong to user',
        });
      }
      console.log('Booking verified:', booking._id);
    }
    
    // Process based on payment method
    if (paymentMethod === 'stripe') {
      console.log('Processing Stripe payment');
      
      // Check if Stripe is configured
      const stripe = getStripeInstance();
      if (!stripe) {
        console.error('Stripe instance not available');
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
      
      console.log('Payment intent result:', result);
      return res.status(result.success ? 200 : 400).json(result);
    } else if (paymentMethod === 'wallet') {
      console.log('Processing wallet payment');
      const result = await processWalletPayment({
        amount,
        currency,
        userId,
        bookingId,
        description: `Payment for booking ${bookingId}`,
      });
      
      console.log('Wallet payment result:', result);
      return res.status(result.success ? 200 : 400).json(result);
    } else {
      console.error('Unsupported payment method:', paymentMethod);
      return res.status(400).json({
        success: false,
        message: 'Unsupported payment method',
      });
    }
  } catch (error: unknown) {
    console.error('Payment creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing payment',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Handle Stripe webhook
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const stripe = getStripeInstance();
  if (!stripe) {
    return res.status(500).json({
      success: false,
      message: 'Stripe is not configured properly',
    });
  }

  const sig = req.headers['stripe-signature'];
  
  if (!sig || typeof sig !== 'string') {
    return res.status(400).json({
      success: false, 
      message: 'Stripe signature is missing or invalid'
    });
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
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
    console.error('Webhook error:', err instanceof Error ? err.message : String(err));
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
  }
};

// Get user's payment history
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    
    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('booking', 'date status');
    
    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error: unknown) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Process refund
export const processRefund = async (req: Request, res: Response) => {
  try {
    const { paymentId, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    // Only admins can process refunds
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can process refunds',
      });
    }
    
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }
    
    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been refunded',
      });
    }
    
    // Process refund based on payment method
    if (payment.paymentMethod === 'stripe' && payment.stripePaymentId) {
      const stripe = getStripeInstance();
      if (!stripe) {
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
      
      return res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        refund,
      });
    } else if (payment.paymentMethod === 'wallet') {
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
        
        return res.status(200).json({
          success: true,
          message: 'Refund processed successfully to user wallet',
          wallet,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to process refund to wallet',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported payment method for refund',
      });
    }
  } catch (error: unknown) {
    console.error('Refund processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the refund',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Helper functions
const handleSuccessfulPayment = async (paymentIntent: any) => {
  try {
    console.log('Processing successful payment:', paymentIntent.id);
    const { userId, bookingId } = paymentIntent.metadata;
    
    if (!userId) {
      console.error('Missing userId in payment intent metadata');
      return;
    }
    
    console.log('Payment metadata:', { userId, bookingId });
    
    // Update the payment status in our database
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentId: paymentIntent.id },
      { status: 'completed' },
      { new: true }
    );
    
    if (!payment) {
      console.error('Payment record not found for Stripe payment ID:', paymentIntent.id);
      return;
    }
    
    console.log('Payment status updated:', payment._id);
    
    // If there's a booking associated, update its payment status
    if (bookingId) {
      console.log('Updating booking status for:', bookingId);
      const booking = await Booking.findByIdAndUpdate(
        bookingId, 
        { 
          paymentStatus: 'paid',
          status: 'confirmed', 
        },
        { new: true }
      );
      
      if (!booking) {
        console.error('Booking not found:', bookingId);
      } else {
        console.log('Booking updated successfully:', booking._id);
      }
    }
  } catch (error) {
    console.error('Error handling successful payment:', error instanceof Error ? error.message : String(error));
  }
};

const handleFailedPayment = async (paymentIntent: any) => {
  try {
    console.log('Processing failed payment:', paymentIntent.id);
    
    // Update the payment status in our database
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentId: paymentIntent.id },
      { status: 'failed' },
      { new: true }
    );
    
    if (!payment) {
      console.error('Payment record not found for Stripe payment ID:', paymentIntent.id);
      return;
    }
    
    console.log('Payment status updated to failed:', payment._id);
    
    // Update booking status if applicable
    const { bookingId } = paymentIntent.metadata;
    
    if (bookingId) {
      console.log('Updating booking payment status to failed for:', bookingId);
      const booking = await Booking.findByIdAndUpdate(
        bookingId, 
        { paymentStatus: 'failed' },
        { new: true }
      );
      
      if (!booking) {
        console.error('Booking not found:', bookingId);
      } else {
        console.log('Booking payment status updated to failed:', booking._id);
      }
    }
  } catch (error) {
    console.error('Error handling failed payment:', error instanceof Error ? error.message : String(error));
  }
}; 