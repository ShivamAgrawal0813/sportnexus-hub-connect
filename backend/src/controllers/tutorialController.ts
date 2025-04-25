import { Request, Response } from 'express';
import Tutorial, { ITutorial } from '../models/Tutorial';
import Purchase from '../models/Purchase';
import Wallet from '../models/Wallet';
import Transaction from '../models/Transaction';
import Payment from '../models/Payment';
import Discount from '../models/Discount';
import getStripeInstance from '../config/stripe';

// Get Stripe instance
const stripe = getStripeInstance() || {
  paymentIntents: {
    create: () => Promise.reject(new Error('Stripe is not configured')),
    retrieve: () => Promise.reject(new Error('Stripe is not configured')),
    confirm: () => Promise.reject(new Error('Stripe is not configured'))
  }
};

// Helper function to format YouTube URLs
const formatYouTubeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // youtu.be format
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // youtube.com/watch format
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Return original if not a recognized YouTube URL
    return url;
  } catch (error) {
    console.error('Error formatting YouTube URL:', error);
    return url;
  }
};

// @desc    Get all tutorials with pagination and filters
// @route   GET /api/tutorials
// @access  Public
export const getTutorials = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filterObj: any = {};

    // Apply filters if provided
    if (req.query.sportType) {
      filterObj.sportType = req.query.sportType;
    }

    if (req.query.skillLevel) {
      filterObj.skillLevel = req.query.skillLevel;
    }

    if (req.query.author) {
      filterObj.author = req.query.author;
    }

    if (req.query.tag) {
      filterObj.tags = { $in: [req.query.tag] };
    }

    // Filter by tutorial type (free or premium)
    if (req.query.tutorialType) {
      filterObj.tutorialType = req.query.tutorialType;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      filterObj.price = {};
      if (req.query.minPrice) {
        filterObj.price.$gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        filterObj.price.$lte = parseFloat(req.query.maxPrice as string);
      }
    }

    // Search functionality
    if (req.query.search) {
      filterObj.$text = { $search: req.query.search as string };
    }

    // Execute query
    const tutorials = await Tutorial.find(filterObj)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Tutorial.countDocuments(filterObj);

    res.json({
      tutorials,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error: any) {
    console.error('Get tutorials error:', error);
    res.status(500).json({
      message: 'Server error fetching tutorials',
      error: error.message,
    });
  }
};

// @desc    Get single tutorial by ID
// @route   GET /api/tutorials/:id
// @access  Public
export const getTutorialById = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id).populate(
      'author',
      'name'
    );

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Increment views
    tutorial.views += 1;
    await tutorial.save();

    // If tutorial is free, return the full tutorial
    if (tutorial.tutorialType === 'Free') {
      return res.json(tutorial);
    }

    // If tutorial is premium, check if user is authenticated
    if (!req.user) {
      // Return limited tutorial info for non-authenticated users
      const limitedTutorial = {
        ...tutorial.toObject(),
        content: tutorial.content.substring(0, 200) + '... (Subscribe to view full content)',
        resources: [], // Hide resources
        isPurchased: false,
        isPreview: true
      };
      
      return res.json(limitedTutorial);
    }

    // For authenticated users, check if they have purchased this tutorial
    // We would typically check against a purchases/enrollments collection
    // For now, we'll simulate this with a basic check
    
    // This is where you would check against your purchases/enrollments collection
    // const purchase = await Purchase.findOne({ 
    //   user: req.user.id, 
    //   tutorialId: tutorial._id,
    //   status: 'completed'
    // });

    // const hasActiveSubscription = await Subscription.findOne({
    //   user: req.user.id,
    //   status: 'active',
    //   expiresAt: { $gt: new Date() }
    // });

    // For this implementation, we'll check if the user is the author or admin
    const isOwnerOrAdmin = 
      (req.user.id && tutorial.author.toString() === req.user.id) || 
      (req.user.role === 'admin');
    
    if (isOwnerOrAdmin) {
      // Full access for tutorial owner or admin
      return res.json({
        ...tutorial.toObject(),
        isPurchased: true,
        isPreview: false
      });
    }

    // Return limited tutorial for users who haven't purchased
    const limitedTutorial = {
      ...tutorial.toObject(),
      content: tutorial.content.substring(0, 200) + '... (Purchase to view full content)',
      resources: [], // Hide resources
      isPurchased: false,
      isPreview: true
    };
    
    return res.json(limitedTutorial);
  } catch (error: any) {
    console.error('Get tutorial by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching tutorial',
      error: error.message,
    });
  }
};

// @desc    Create a new tutorial
// @route   POST /api/tutorials
// @access  Private
export const createTutorial = async (req: Request, res: Response) => {
  try {
    const tutorialData = {
      ...req.body,
      author: req.user.id,
    };

    // Validate tutorial type and price
    if (tutorialData.tutorialType === 'Free' && tutorialData.price !== 0) {
      return res.status(400).json({
        message: 'Free tutorials must have a price of 0',
      });
    }

    if (tutorialData.tutorialType === 'Premium' && (!tutorialData.price || tutorialData.price <= 0)) {
      return res.status(400).json({
        message: 'Premium tutorials must have a price greater than 0',
      });
    }

    // Format YouTube URL if provided
    if (tutorialData.videoUrl) {
      tutorialData.videoUrl = formatYouTubeUrl(tutorialData.videoUrl);
    }

    // Format YouTube URLs in resources
    if (tutorialData.resources && Array.isArray(tutorialData.resources)) {
      tutorialData.resources = tutorialData.resources.map(resource => {
        if (resource.type === 'Video' && resource.url) {
          return {
            ...resource,
            url: formatYouTubeUrl(resource.url)
          };
        }
        return resource;
      });
    }

    const tutorial = await Tutorial.create(tutorialData);

    res.status(201).json(tutorial);
  } catch (error: any) {
    console.error('Create tutorial error:', error);
    res.status(500).json({
      message: 'Server error creating tutorial',
      error: error.message,
    });
  }
};

// @desc    Update a tutorial
// @route   PUT /api/tutorials/:id
// @access  Private
export const updateTutorial = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Check if user is the author
    if (tutorial.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this tutorial' });
    }

    const updateData = { ...req.body };
    
    // Validate tutorial type and price if they are being updated
    if (updateData.tutorialType === 'Free' && updateData.price !== 0) {
      return res.status(400).json({
        message: 'Free tutorials must have a price of 0',
      });
    }

    if (updateData.tutorialType === 'Premium' && (!updateData.price || updateData.price <= 0)) {
      return res.status(400).json({
        message: 'Premium tutorials must have a price greater than 0',
      });
    }

    // Check if only tutorialType is updated but not price
    if (
      updateData.tutorialType && 
      updateData.price === undefined
    ) {
      if (updateData.tutorialType === 'Free') {
        updateData.price = 0;
      } else if (updateData.tutorialType === 'Premium' && tutorial.price === 0) {
        return res.status(400).json({
          message: 'Please provide a price for the premium tutorial',
        });
      }
    }

    // Format YouTube URL if provided
    if (updateData.videoUrl) {
      updateData.videoUrl = formatYouTubeUrl(updateData.videoUrl);
    }

    // Format YouTube URLs in resources
    if (updateData.resources && Array.isArray(updateData.resources)) {
      updateData.resources = updateData.resources.map(resource => {
        if (resource.type === 'Video' && resource.url) {
          return {
            ...resource,
            url: formatYouTubeUrl(resource.url)
          };
        }
        return resource;
      });
    }

    // Update tutorial data
    const updatedTutorial = await Tutorial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedTutorial);
  } catch (error: any) {
    console.error('Update tutorial error:', error);
    res.status(500).json({
      message: 'Server error updating tutorial',
      error: error.message,
    });
  }
};

// @desc    Delete a tutorial
// @route   DELETE /api/tutorials/:id
// @access  Private
export const deleteTutorial = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Check if user is the author or an admin
    if (tutorial.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this tutorial' });
    }

    await tutorial.deleteOne();
    res.json({ message: 'Tutorial removed' });
  } catch (error: any) {
    console.error('Delete tutorial error:', error);
    res.status(500).json({
      message: 'Server error deleting tutorial',
      error: error.message,
    });
  }
};

// @desc    Like a tutorial
// @route   POST /api/tutorials/:id/like
// @access  Private
export const likeTutorial = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Increment likes
    tutorial.likes += 1;
    await tutorial.save();

    res.json({ likes: tutorial.likes });
  } catch (error: any) {
    console.error('Like tutorial error:', error);
    res.status(500).json({
      message: 'Server error liking tutorial',
      error: error.message,
    });
  }
};

// @desc    Get user's enrolled tutorials
// @route   GET /api/tutorials/enrolled
// @access  Private
export const getEnrolledTutorials = async (req: Request, res: Response) => {
  try {
    // In a real application, we'd query an enrollments collection 
    // For now, we'll just return some recent tutorials as "enrolled"
    const tutorials = await Tutorial.find({})
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      tutorials,
      success: true
    });
  } catch (error: any) {
    console.error('Get enrolled tutorials error:', error);
    res.status(500).json({
      message: 'Server error fetching enrolled tutorials',
      error: error.message,
    });
  }
};

// @desc    Process payment for tutorial
// @route   POST /api/tutorials/:id/payment
// @access  Private
export const processTutorialPayment = async (req: Request, res: Response) => {
  try {
    const { paymentMethod, promoCode, stripeToken, paymentIntentId } = req.body;
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Free tutorials don't need to be purchased
    if (tutorial.tutorialType === 'Free') {
      return res.status(400).json({
        message: 'This tutorial is free and does not require payment',
      });
    }

    // Check if user already purchased this tutorial
    const existingPurchase = await Purchase.findOne({
      user: req.user.id,
      tutorialId: tutorial._id,
      status: 'completed'
    });

    if (existingPurchase) {
      return res.status(400).json({
        message: 'You have already purchased this tutorial',
      });
    }

    let finalPrice = tutorial.price;
    let discountApplied = null;
    const originalPrice = tutorial.price;

    // Apply promo code if provided
    if (promoCode) {
      // Implement discount logic here (similar to venue/equipment)
      const discount = await Discount.findOne({ 
        code: promoCode,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (discount) {
        if (discount.applicableTo === 'all' || discount.applicableTo === 'tutorial') {
          if (discount.discountType === 'percentage') {
            finalPrice = finalPrice * (1 - discount.value / 100);
          } else {
            finalPrice = Math.max(0, finalPrice - discount.value);
          }
          discountApplied = {
            code: discount.code,
            value: discount.value,
            type: discount.discountType
          };
        }
      }
    }

    // Handle different payment methods
    let paymentResult;
    
    switch (paymentMethod) {
      case 'wallet':
        // Process wallet payment
        paymentResult = await processWalletPayment(req.user.id, tutorial, finalPrice);
        break;
        
      case 'card':
        // Process card payment via Stripe
        paymentResult = await processCardPayment(
          req.user.id, 
          tutorial, 
          finalPrice, 
          stripeToken || '', 
          paymentIntentId
        );
        break;
        
      default:
        return res.status(400).json({
          message: 'Invalid payment method',
        });
    }

    if (!paymentResult.success) {
      return res.status(400).json({
        message: paymentResult.message,
        ...paymentResult // Include additional fields like currentBalance if present
      });
    }

    // Create purchase record
    const purchase = await Purchase.create({
      user: req.user.id,
      tutorialId: tutorial._id,
      price: finalPrice,
      originalPrice: finalPrice !== originalPrice ? originalPrice : undefined,
      status: 'completed',
      transactionId: paymentResult.transactionId,
      discountApplied,
      paymentMethod
    });

    res.status(200).json({
      message: 'Tutorial purchased successfully',
      tutorial: {
        _id: tutorial._id,
        title: tutorial.title,
        originalPrice: tutorial.price,
        finalPrice
      },
      transaction: paymentResult.transactionData,
      discountApplied
    });
  } catch (error: any) {
    console.error('Process tutorial payment error:', error);
    res.status(500).json({
      message: 'Server error processing payment',
      error: error.message,
    });
  }
};

// Helper function to process wallet payment
const processWalletPayment = async (userId: string, tutorial: any, amount: number) => {
  // Check wallet balance
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet || wallet.balance < amount) {
    return {
      success: false,
      message: 'Insufficient funds in your wallet. Please add funds to continue.',
      currentBalance: wallet ? wallet.balance : 0,
      requiredAmount: amount
    };
  }

  // Create transaction
  const transaction = await Transaction.create({
    user: userId,
    amount,
    type: 'purchase',
    status: 'completed',
    description: `Purchase of tutorial: ${tutorial.title}`,
    itemType: 'tutorial',
    itemId: tutorial._id
  });

  // Update wallet balance
  wallet.balance -= amount;
  
  // Add transaction record to wallet
  wallet.transactions.push({
    amount,
    type: 'debit',
    description: `Tutorial purchase: ${tutorial.title}`,
    reference: transaction._id.toString(),
    createdAt: new Date(),
    metadata: {
      tutorialId: tutorial._id.toString(),
      transactionId: transaction._id.toString()
    }
  });
  
  await wallet.save();

  return {
    success: true,
    transactionId: transaction._id,
    transactionData: {
      _id: transaction._id,
      amount: transaction.amount,
      method: 'wallet',
      newBalance: wallet.balance
    }
  };
};

// Helper function to process card payment
const processCardPayment = async (
  userId: string, 
  tutorial: any, 
  amount: number, 
  stripeToken: string,
  paymentIntentId?: string
) => {
  try {
    // First, get the stripe instance
    const stripe = await getStripeInstance();
    
    // Check if this is a test token
    if (stripeToken === 'tok_visa' || stripeToken === 'tok_mastercard') {
      console.log('Using test token for development:', stripeToken);
      
      // Create transaction record for the test payment
      const transaction = await Transaction.create({
        user: userId,
        amount,
        type: 'purchase',
        status: 'completed',
        description: `Purchase of tutorial: ${tutorial.title} (Test Card Payment)`,
        itemType: 'tutorial',
        itemId: tutorial._id
      });
      
      // Create a dummy payment record
      const payment = await Payment.create({
        user: userId,
        amount,
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentId: 'test_' + Date.now(),
        itemType: 'tutorial',
        itemId: tutorial._id
      });
      
      return {
        success: true,
        transactionId: transaction._id,
        transactionData: {
          _id: transaction._id,
          amount: transaction.amount,
          method: 'card',
          paymentId: payment._id
        }
      };
    }
    
    // If stripe is not configured and not using a test token, return error
    if (!stripe) {
      return {
        success: false,
        message: 'Payment processing unavailable. Please try again later or use wallet payment.'
      };
    }
    
    // Real Stripe implementation for production
    let paymentIntent;
    
    if (paymentIntentId) {
      // If payment intent already exists, retrieve it
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Payment already completed
      } else {
        // Confirm payment
        paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: stripeToken
        });
      }
    } else {
      // Create new payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        currency: 'usd',
        payment_method_types: ['card'],
        payment_method: stripeToken,
        confirm: true,
        description: `Tutorial purchase: ${tutorial.title}`
      });
    }
    
    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        message: 'Payment processing failed',
        status: paymentIntent.status
      };
    }
    
    // Create payment record
    const payment = await Payment.create({
      user: userId,
      amount,
      paymentMethod: 'card',
      status: 'completed',
      stripePaymentId: paymentIntent.id,
      itemType: 'tutorial',
      itemId: tutorial._id
    });
    
    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      amount,
      type: 'purchase',
      status: 'completed',
      description: `Purchase of tutorial: ${tutorial.title} (Card Payment)`,
      itemType: 'tutorial',
      itemId: tutorial._id
    });
    
    return {
      success: true,
      transactionId: transaction._id,
      transactionData: {
        _id: transaction._id,
        amount: transaction.amount,
        method: 'card',
        paymentId: payment._id
      }
    };
  } catch (error: any) {
    console.error('Card payment processing error:', error);
    return {
      success: false,
      message: error.message || 'Payment processing failed'
    };
  }
};

// Update purchaseTutorial to use the new payment processing system
export const purchaseTutorial = async (req: Request, res: Response) => {
  try {
    // Clone request body or create a new one if it doesn't exist
    req.body = req.body || {};
    
    // For backward compatibility, process as wallet payment
    req.body.paymentMethod = 'wallet';
    
    console.log('Warning: The /purchase endpoint is deprecated. Please use /payment endpoint instead.');
    
    return processTutorialPayment(req, res);
  } catch (error: any) {
    console.error('Purchase tutorial error:', error);
    res.status(500).json({
      message: 'Server error processing purchase',
      error: error.message,
    });
  }
};

export default {
  getTutorials,
  getTutorialById,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  likeTutorial,
  getEnrolledTutorials,
  purchaseTutorial,
  processTutorialPayment
}; 