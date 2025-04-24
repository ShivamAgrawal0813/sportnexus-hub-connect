import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import stripe from '../config/stripe';

// Get subscription plans
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    // Define subscription plans
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Access to all equipment listings',
          'Access to all venue listings',
          'Access to all tutorial listings',
          'Basic booking functionality',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'All Basic features',
          'Priority booking for equipment and venues',
          'Access to premium tutorials',
          '10% discount on all bookings',
          'No booking fees',
        ],
      },
      {
        id: 'pro',
        name: 'Professional',
        price: 39.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'All Premium features',
          'VIP booking for limited equipment and venues',
          'Access to exclusive professional tutorials',
          '20% discount on all bookings',
          'Flexible cancellation policy',
          'Dedicated support',
        ],
      },
    ];
    
    return res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription plans',
      error: error.message,
    });
  }
};

// Get user's subscription
export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
    });
    
    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user subscription',
      error: error.message,
    });
  }
};

// Create subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { plan, paymentMethod } = req.body;
    const userId = req.user.id;
    
    if (!plan || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Plan and payment method are required',
      });
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
      });
    }
    
    // Get plan details
    const planDetails = getPlanDetails(plan);
    
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan',
      });
    }
    
    // Create subscription in Stripe
    if (paymentMethod === 'stripe') {
      // This would typically use Stripe Subscription API
      // For simplicity, we're using a direct approach here
      
      const currentDate = new Date();
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Create subscription in our database
      const subscription = await Subscription.create({
        user: userId,
        plan,
        status: 'active',
        currentPeriodStart: currentDate,
        currentPeriodEnd: nextMonth,
        cancelAtPeriodEnd: false,
        features: planDetails.features,
        price: planDetails.price,
        currency: planDetails.currency,
      });
      
      return res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        subscription,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported payment method',
      });
    }
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message,
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Find the active subscription
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found',
      });
    }
    
    // Cancel at period end
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    
    // If using Stripe, you would also update the subscription there
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      subscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message,
    });
  }
};

// Helper function to get plan details
const getPlanDetails = (planId: string) => {
  const plans = {
    basic: {
      name: 'Basic',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Access to all equipment listings',
        'Access to all venue listings',
        'Access to all tutorial listings',
        'Basic booking functionality',
      ],
    },
    premium: {
      name: 'Premium',
      price: 19.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'All Basic features',
        'Priority booking for equipment and venues',
        'Access to premium tutorials',
        '10% discount on all bookings',
        'No booking fees',
      ],
    },
    pro: {
      name: 'Professional',
      price: 39.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'All Premium features',
        'VIP booking for limited equipment and venues',
        'Access to exclusive professional tutorials',
        '20% discount on all bookings',
        'Flexible cancellation policy',
        'Dedicated support',
      ],
    },
  };
  
  return plans[planId];
}; 