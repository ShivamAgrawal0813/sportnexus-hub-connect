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
    const { preferredCurrency } = req.query;
    
    let wallet = await Wallet.findOne({ user: userId });
    
    // Create a wallet if it doesn't exist
    if (!wallet) {
      // Use preferredCurrency if provided in the query, otherwise default to USD
      const currency = preferredCurrency === 'INR' ? 'INR' : 'USD';
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
        currency, // Use either INR or USD based on preference
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
    
    const { paymentIntentId, currency } = req.body;
    
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
    // Update currency if provided in the request
    if (currency) {
      payment.currency = currency;
    }
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

// Update wallet currency
export const updateWalletCurrency = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    const { currency } = req.body;
    
    if (!currency || !['USD', 'INR'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Valid currency (USD or INR) is required',
      });
    }
    
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }
    
    // Check if the currency is actually changing to prevent unnecessary conversions
    if (wallet.currency === currency) {
      return res.status(200).json({
        success: true,
        message: 'Wallet already using this currency',
        wallet,
      });
    }
    
    // Check for recent conversions (within the last 5 seconds) to prevent multiple rapid conversions
    const recentConversion = wallet.transactions.find(t => 
      t.type === 'conversion' && 
      (new Date().getTime() - new Date(t.createdAt).getTime()) < 5000
    );
    
    if (recentConversion) {
      return res.status(429).json({
        success: false,
        message: 'Please wait a moment before converting currency again',
        wallet,
      });
    }
    
    // Initialize wallet.metadata if it doesn't exist
    if (!wallet.metadata) {
      wallet.metadata = {};
    }
    
    // Only do conversion if currency is changing
    if (wallet.currency !== currency) {
      // Define exchange rates (These should ideally come from a real-time API)
      const exchangeRates = {
        USD_TO_INR: 83.0, // 1 USD = 83.0 INR (example rate)
        INR_TO_USD: 1/83.0, // 1 INR = 1/83.0 USD (inverse of USD_TO_INR to ensure precision)
      };
      
      // Get the previous balance before conversion
      const previousBalance = wallet.balance;
      const previousCurrency = wallet.currency;
      
      // Convert the balance based on the currency change
      if (wallet.currency === 'USD' && currency === 'INR') {
        // Converting from USD to INR - store the USD value
        wallet.metadata.originalUsdBalance = wallet.balance;
        wallet.balance = Math.round(wallet.balance * exchangeRates.USD_TO_INR * 100) / 100;
        
        // For each transaction, add metadata about original currency if not yet present
        wallet.transactions.forEach(transaction => {
          if (!transaction.metadata) {
            transaction.metadata = {};
          }
          if (!transaction.metadata.originalCurrency) {
            transaction.metadata.originalCurrency = 'USD';
            transaction.metadata.originalAmount = transaction.amount;
          }
        });
        
      } else if (wallet.currency === 'INR' && currency === 'USD') {
        // Check if we need to account for new funds added in INR
        const expectedInrBalance = wallet.metadata.originalUsdBalance ? 
          Math.round(wallet.metadata.originalUsdBalance * exchangeRates.USD_TO_INR * 100) / 100 : 
          0;
          
        if (Math.abs(wallet.balance - expectedInrBalance) > 0.01) {
          // The balance has changed since last conversion, need to update originalUsdBalance
          console.log("Balance changed since last conversion - updating originalUsdBalance");
          // Convert the current INR balance to USD
          const newUsdBalance = Math.round(wallet.balance * exchangeRates.INR_TO_USD * 100) / 100;
          wallet.metadata.originalUsdBalance = newUsdBalance;
        }
      
        // For each transaction, add metadata about original currency if not yet present
        wallet.transactions.forEach(transaction => {
          if (!transaction.metadata) {
            transaction.metadata = {};
          }
          if (!transaction.metadata.originalCurrency) {
            transaction.metadata.originalCurrency = 'INR';
            transaction.metadata.originalAmount = transaction.amount;
          }
        });
        
        // Use the stored or newly calculated USD value
        if (wallet.metadata.originalUsdBalance) {
          wallet.balance = wallet.metadata.originalUsdBalance;
        } else {
          // Fallback if no metadata available
          wallet.balance = Math.round(wallet.balance * exchangeRates.INR_TO_USD * 100) / 100;
          wallet.metadata.originalUsdBalance = wallet.balance;
        }
      }
      
      // Update the wallet currency
      wallet.currency = currency;
      
      // Add a transaction record for the currency conversion
      wallet.transactions.push({
        amount: wallet.balance,
        type: 'conversion',
        description: `Currency converted from ${previousBalance} ${previousCurrency} to ${wallet.balance} ${currency}`,
        createdAt: new Date(),
        metadata: {
          originalAmount: previousBalance,
          originalCurrency: previousCurrency,
          conversionRate: previousCurrency === 'USD' ? exchangeRates.USD_TO_INR : exchangeRates.INR_TO_USD
        }
      });
    }
    
    await wallet.save();
    
    return res.status(200).json({
      success: true,
      message: 'Wallet currency updated successfully',
      wallet,
    });
  } catch (error: unknown) {
    console.error('Update wallet currency error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update wallet currency',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}; 