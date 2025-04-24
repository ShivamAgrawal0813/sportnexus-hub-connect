import { Request, Response } from 'express';
import Wallet from '../models/Wallet';
import Payment from '../models/Payment';
import { addFundsToWallet } from '../utils/paymentService';
import getStripeInstance from '../config/stripe';

// Get user's wallet
export const getWallet = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    
    let wallet = await Wallet.findOne({ user: userId });
    
    // Create a wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
        currency: 'USD', // Default currency
        transactions: [],
      });
    }
    
    return res.status(200).json({
      success: true,
      wallet,
    });
  } catch (error: unknown) {
    console.error('Get wallet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Add funds to wallet using Stripe
export const addFunds = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const { amount, currency = 'USD' } = req.body;
    const userId = req.user.id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid amount is required',
      });
    }
    
    // Get Stripe instance
    const stripe = getStripeInstance();
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured properly',
      });
    }
    
    // Create a payment intent for adding funds to wallet
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires amounts in cents
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        purpose: 'wallet_funding',
      },
    });
    
    // Create a payment record
    await Payment.create({
      user: userId,
      amount,
      currency,
      status: 'pending',
      paymentMethod: 'stripe',
      stripePaymentId: paymentIntent.id,
      metadata: {
        purpose: 'wallet_funding',
      },
    });
    
    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    console.error('Add funds error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add funds to wallet',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Handle successful wallet funding
export const processWalletFunding = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required',
      });
    }
    
    // Get Stripe instance
    const stripe = getStripeInstance();
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured properly',
      });
    }
    
    console.log('Processing wallet funding with payment intent ID:', paymentIntentId);
    
    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed',
      });
    }
    
    // Find the payment record
    const payment = await Payment.findOne({ stripePaymentId: paymentIntentId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }
    
    // Check if it's already been processed
    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been processed',
      });
    }
    
    // Update payment status
    payment.status = 'completed';
    await payment.save();
    
    // Add funds to wallet
    const userId = payment.user instanceof Object ? payment.user.toString() : String(payment.user);
    const paymentId = payment._id instanceof Object ? payment._id.toString() : String(payment._id);
    
    const result = await addFundsToWallet(
      userId,
      payment.amount,
      payment.currency,
      paymentId
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add funds to wallet',
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Funds added to wallet successfully',
      wallet: result.wallet,
    });
  } catch (error: unknown) {
    console.error('Process wallet funding error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing wallet funding',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get wallet transaction history
export const getTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }
    
    // Sort transactions from newest to oldest
    const transactions = [...wallet.transactions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return res.status(200).json({
      success: true,
      transactions,
      balance: wallet.balance,
      currency: wallet.currency,
    });
  } catch (error: unknown) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet transactions',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}; 