import getStripeInstance from '../config/stripe';
import Payment from '../models/Payment';
import Wallet from '../models/Wallet';
import Discount from '../models/Discount';
import { Types } from 'mongoose';
import Booking from '../models/Booking';

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  userId: string;
  bookingId?: string;
  paymentMethod: 'stripe' | 'paypal' | 'wallet';
  discountCode?: string;
}

interface ProcessWalletPaymentParams {
  amount: number;
  currency: string;
  userId: string;
  bookingId?: string;
  description: string;
}

export const calculateDiscountedAmount = async (
  amount: number,
  discountCode?: string,
  itemType?: 'equipment' | 'venue' | 'tutorial'
): Promise<number> => {
  if (!discountCode) return amount;

  try {
    console.log('Looking up discount code:', discountCode);
    
    const discount = await Discount.findOne({
      code: discountCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$currentUses", "$maxUses"] },
      ...(itemType && { $or: [{ applicableItems: 'all' }, { applicableItems: itemType }] }),
    });

    if (!discount) {
      console.log('Discount not found or not valid');
      return amount;
    }

    console.log('Found discount:', discount);

    // Check minimum order value
    if (discount.minOrderValue && amount < discount.minOrderValue) {
      console.log('Order amount below minimum required for discount');
      return amount;
    }

    let discountedAmount = 0;
    
    if (discount.type === 'percentage') {
      discountedAmount = amount * (discount.value / 100);
      
      // Apply max discount amount if set
      if (discount.maxDiscountAmount && discountedAmount > discount.maxDiscountAmount) {
        discountedAmount = discount.maxDiscountAmount;
      }
    } else {
      // Fixed discount
      discountedAmount = discount.value;
    }

    // Increment usage count
    await Discount.findByIdAndUpdate(discount._id, { $inc: { currentUses: 1 } });

    console.log('Applied discount:', {
      originalAmount: amount,
      discountedAmount,
      finalAmount: Math.max(0, amount - discountedAmount)
    });

    return Math.max(0, amount - discountedAmount);
  } catch (error) {
    console.error('Error applying discount:', error);
    return amount;
  }
};

export const createPaymentIntent = async ({
  amount,
  currency,
  userId,
  bookingId,
  paymentMethod,
  discountCode,
}: CreatePaymentIntentParams) => {
  try {
    console.log('Creating payment intent with params:', { 
      amount, currency, userId, bookingId, paymentMethod, discountCode 
    });
    
    const finalAmount = await calculateDiscountedAmount(amount, discountCode);
    console.log('Calculated final amount after discounts:', finalAmount);
    
    if (paymentMethod === 'stripe') {
      const stripe = getStripeInstance();
      if (!stripe) {
        console.error('Stripe instance not available - check environment variables');
        return {
          success: false,
          message: 'Stripe is not configured properly',
        };
      }
      
      console.log('Creating Stripe payment intent for amount:', Math.round(finalAmount * 100));
      
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(finalAmount * 100), // Stripe requires amounts in cents
          currency,
          metadata: {
            userId,
            bookingId: bookingId || '',
          },
        });
        
        console.log('Payment intent created:', paymentIntent.id);

        // Create a payment record in our database
        const payment = await Payment.create({
          user: userId,
          booking: bookingId,
          amount: finalAmount,
          currency,
          status: 'pending',
          paymentMethod: 'stripe',
          stripePaymentId: paymentIntent.id,
        });
        
        console.log('Payment record created in database:', payment._id);

        return {
          success: true,
          clientSecret: paymentIntent.client_secret,
          amount: finalAmount,
        };
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        return {
          success: false,
          message: 'Stripe API error occurred',
          error: stripeError instanceof Error ? stripeError.message : String(stripeError),
        };
      }
    }
    
    // Handle other payment methods if needed
    console.error('Unsupported payment method:', paymentMethod);
    return {
      success: false,
      message: 'Unsupported payment method',
    };
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return {
      success: false,
      message: 'Failed to create payment intent',
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const processWalletPayment = async ({
  amount,
  currency,
  userId,
  bookingId,
  description,
}: ProcessWalletPaymentParams) => {
  try {
    // Find user's wallet
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      return {
        success: false,
        message: 'Wallet not found for this user',
      };
    }
    
    // Define exchange rates for currency conversion if needed
    const exchangeRates = {
      USD_TO_INR: 83.0,
      INR_TO_USD: 1/83.0,
    };
    
    // Check if currency conversion is needed
    let paymentAmountInWalletCurrency = amount;
    if (wallet.currency !== currency) {
      // Convert the payment amount to the wallet's currency
      if (currency === 'USD' && wallet.currency === 'INR') {
        paymentAmountInWalletCurrency = Math.round(amount * exchangeRates.USD_TO_INR * 100) / 100;
      } else if (currency === 'INR' && wallet.currency === 'USD') {
        paymentAmountInWalletCurrency = Math.round(amount * exchangeRates.INR_TO_USD * 100) / 100;
      }
    }
    
    // Check if wallet has sufficient balance
    if (wallet.balance < paymentAmountInWalletCurrency) {
      return {
        success: false,
        message: `Insufficient wallet balance. Available: ${wallet.balance} ${wallet.currency}, Required: ${paymentAmountInWalletCurrency} ${wallet.currency}`,
      };
    }
    
    // Initialize metadata if it doesn't exist
    if (!wallet.metadata) {
      wallet.metadata = {};
    }
    
    // Update wallet balance
    wallet.balance -= paymentAmountInWalletCurrency;
    
    // Update originalUsdBalance in metadata
    if (wallet.currency === 'USD' && wallet.metadata.originalUsdBalance) {
      wallet.metadata.originalUsdBalance -= paymentAmountInWalletCurrency;
      if (wallet.metadata.originalUsdBalance < 0) {
        wallet.metadata.originalUsdBalance = 0;
      }
    } else if (wallet.currency === 'INR' && wallet.metadata.originalUsdBalance) {
      // If spending INR, convert it to USD and subtract from originalUsdBalance
      const usdAmount = Math.round(paymentAmountInWalletCurrency * exchangeRates.INR_TO_USD * 100) / 100;
      wallet.metadata.originalUsdBalance -= usdAmount;
      if (wallet.metadata.originalUsdBalance < 0) {
        wallet.metadata.originalUsdBalance = 0;
      }
    }
    
    // Add transaction record to the wallet
    wallet.transactions.push({
      amount: paymentAmountInWalletCurrency,
      type: 'debit',
      description: wallet.currency !== currency 
        ? `${description} (Converted from ${amount} ${currency})` 
        : description,
      reference: bookingId,
      createdAt: new Date(),
      metadata: {
        originalAmount: amount,
        originalCurrency: currency
      }
    });
    
    await wallet.save();
    
    // Create payment record - always use the original currency for the payment record
    const payment = await Payment.create({
      user: userId,
      booking: bookingId,
      amount, // Original amount in the requested currency
      currency, // Original currency
      status: 'completed',
      paymentMethod: 'wallet',
      metadata: {
        walletCurrency: wallet.currency,
        walletAmount: paymentAmountInWalletCurrency
      }
    });
    
    // Update booking status if bookingId exists
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed'
      });
    }
    
    return {
      success: true,
      payment,
      wallet
    };
  } catch (error) {
    console.error('Wallet payment error:', error);
    return {
      success: false,
      message: 'Failed to process wallet payment',
      error,
    };
  }
};

export const addFundsToWallet = async (
  userId: string,
  amount: number,
  currency: string,
  paymentId?: string
) => {
  try {
    let wallet = await Wallet.findOne({ user: userId });
    
    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
        currency,
        transactions: [],
        metadata: {
          originalUsdBalance: currency === 'USD' ? amount : 0
        }
      });
    } else if (wallet.currency !== currency) {
      // If the wallet exists but currency is different, update the currency
      // This allows users to switch between USD and INR
      wallet.currency = currency;
    }
    
    // Initialize metadata if it doesn't exist
    if (!wallet.metadata) {
      wallet.metadata = {};
    }
    
    // Update wallet balance
    wallet.balance += amount;
    
    // If currency is USD, update the originalUsdBalance
    if (currency === 'USD') {
      wallet.metadata.originalUsdBalance = wallet.balance;
    } else if (currency === 'INR' && wallet.metadata.originalUsdBalance) {
      // If adding INR, convert it to USD and add to originalUsdBalance
      // Using exact inverse of USD_TO_INR for precision
      const USD_TO_INR = 83.0;
      const exchangeRate = 1/USD_TO_INR; 
      wallet.metadata.originalUsdBalance += Math.round(amount * exchangeRate * 100) / 100;
    }
    
    wallet.transactions.push({
      amount,
      type: 'credit',
      description: 'Added funds to wallet',
      reference: paymentId,
      createdAt: new Date(),
      metadata: {
        originalAmount: amount,
        originalCurrency: currency
      }
    });
    
    await wallet.save();
    
    return {
      success: true,
      wallet,
    };
  } catch (error) {
    console.error('Add funds to wallet error:', error);
    return {
      success: false,
      message: 'Failed to add funds to wallet',
      error,
    };
  }
}; 