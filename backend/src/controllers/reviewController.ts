import { Request, Response } from 'express';
import Review, { IReview } from '../models/Review';
import Venue from '../models/Venue';
import Equipment from '../models/Equipment';
import Tutorial from '../models/Tutorial';
import mongoose from 'mongoose';

// @desc    Get reviews for a specific item
// @route   GET /api/reviews/:type/:id
// @access  Public
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    
    if (!['venue', 'equipment', 'tutorial'].includes(type)) {
      return res.status(400).json({ message: 'Invalid review type' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filterObj: any = { reviewType: capitalizeFirstLetter(type) };
    
    // Set the item ID based on the type
    if (type === 'venue') {
      filterObj.venue = id;
    } else if (type === 'equipment') {
      filterObj.equipment = id;
    } else {
      filterObj.tutorial = id;
    }

    // Fetch reviews with user details
    const reviews = await Review.find(filterObj)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Review.countDocuments(filterObj);

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: filterObj },
      { 
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].average : 0;

    res.json({
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      stats: {
        averageRating,
        totalReviews: total,
      }
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      message: 'Server error fetching reviews',
      error: error.message,
    });
  }
};

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
export const getReviewById = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id).populate('user', 'name');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error: any) {
    console.error('Get review by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching review',
      error: error.message,
    });
  }
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req: Request, res: Response) => {
  try {
    console.log('Review data received:', req.body);
    
    // Check if params are provided (for type-specific routes)
    const itemType = req.params.type || req.body.itemType;
    const itemId = req.params.id || req.body.itemId;
    const { rating, comment, title, content } = req.body;
    
    // Combine comment and content (for flexibility)
    const reviewContent = content || comment;
    
    // Validate required fields
    if (!itemType || !itemId || !rating) {
      return res.status(400).json({ message: 'Please provide item type, item ID, and rating' });
    }
    
    if (!reviewContent) {
      return res.status(400).json({ message: 'Please provide review content' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Prepare review data
    const reviewData: Partial<IReview> = {
      user: new mongoose.Types.ObjectId(req.user!.id),
      itemType,
      rating,
      title: title || "",
      comment: reviewContent
    };
    
    console.log('Prepared review data:', reviewData);

    // Validate and set the appropriate item field
    let item;
    
    if (itemType === 'venue') {
      item = await Venue.findById(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Venue not found' });
      }
      reviewData.venue = new mongoose.Types.ObjectId(itemId);
    } 
    else if (itemType === 'equipment') {
      item = await Equipment.findById(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      reviewData.equipment = new mongoose.Types.ObjectId(itemId);
    } 
    else if (itemType === 'tutorial') {
      item = await Tutorial.findById(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Tutorial not found' });
      }
      reviewData.tutorial = new mongoose.Types.ObjectId(itemId);
    } 
    else {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      user: req.user!.id,
      itemType,
      ...(itemType === 'venue' ? { venue: itemId } : {}),
      ...(itemType === 'equipment' ? { equipment: itemId } : {}),
      ...(itemType === 'tutorial' ? { tutorial: itemId } : {})
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this item' });
    }

    // Create the review
    const review = await Review.create(reviewData);
    console.log('Review created:', review._id);

    // Populate user details for response
    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    // Update the item's average rating
    await updateItemAverageRating(itemType, itemId);

    res.status(201).json(populatedReview);
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({ 
      message: 'Server error while creating review',
      error: error.message
    });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { rating, title, content } = req.body;
    
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the review belongs to the user
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Update fields if provided
    if (rating) {
      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (title) review.title = title;
    if (content) review.content = content;

    await review.save();

    // Update item's average rating
    let itemType = review.reviewType.toLowerCase();
    let itemId;

    if (itemType === 'venue') {
      itemId = review.venue;
    } else if (itemType === 'equipment') {
      itemId = review.equipment;
    } else {
      itemId = review.tutorial;
    }

    await updateItemRating(itemType, itemId);

    res.json(review);
  } catch (error: any) {
    console.error('Update review error:', error);
    res.status(500).json({
      message: 'Server error updating review',
      error: error.message,
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the review belongs to the user or if user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Store item type and id before deletion
    let itemType = review.reviewType.toLowerCase();
    let itemId;

    if (itemType === 'venue') {
      itemId = review.venue;
    } else if (itemType === 'equipment') {
      itemId = review.equipment;
    } else {
      itemId = review.tutorial;
    }

    await review.deleteOne();

    // Update item's average rating
    await updateItemRating(itemType, itemId);

    res.json({ message: 'Review removed' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    res.status(500).json({
      message: 'Server error deleting review',
      error: error.message,
    });
  }
};

// @desc    Add response to a review (admin only)
// @route   POST /api/reviews/:id/respond
// @access  Private/Admin
export const respondToReview = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Response content is required' });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add response
    review.response = {
      content,
      createdAt: new Date(),
    };

    await review.save();

    res.json(review);
  } catch (error: any) {
    console.error('Respond to review error:', error);
    res.status(500).json({
      message: 'Server error responding to review',
      error: error.message,
    });
  }
};

// Utility functions
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function updateItemRating(type: string, id: any): Promise<void> {
  try {
    // Build filter object for aggregation
    const filterObj: any = { reviewType: capitalizeFirstLetter(type) };
    
    // Set the item ID based on the type
    if (type === 'venue') {
      filterObj.venue = id;
    } else if (type === 'equipment') {
      filterObj.equipment = id;
    } else {
      filterObj.tutorial = id;
    }

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: filterObj },
      { 
        $group: {
          _id: null,
          average: { $avg: '$rating' },
        }
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].average : 0;

    // Update the item's rating
    if (type === 'venue') {
      await Venue.findByIdAndUpdate(id, { rating: averageRating });
    } else if (type === 'equipment') {
      // Note: Equipment model might not have a rating field, so this might need to be added
    } else if (type === 'tutorial') {
      // Note: Tutorial model might not have a rating field, so this might need to be added
    }
  } catch (error) {
    console.error('Update item rating error:', error);
  }
}

// @desc    Get reviews for a specific item by type and ID
// @route   GET /api/reviews/:type/:id
// @access  Public
export const getReviewsForItem = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    
    if (!['venue', 'equipment', 'tutorial'].includes(type)) {
      return res.status(400).json({ message: 'Invalid review type' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filterObj: any = { itemType: type };
    
    // Set the item ID based on the type
    if (type === 'venue') {
      filterObj.venue = id;
    } else if (type === 'equipment') {
      filterObj.equipment = id;
    } else {
      filterObj.tutorial = id;
    }

    // Fetch reviews with user details
    const reviews = await Review.find(filterObj)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Review.countDocuments(filterObj);

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: filterObj },
      { 
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].average : 0;

    res.json({
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      stats: {
        averageRating,
        totalReviews: total,
      }
    });
  } catch (error: any) {
    console.error('Get reviews for item error:', error);
    res.status(500).json({
      message: 'Server error fetching reviews',
      error: error.message,
    });
  }
};

// Helper function to update item's average rating
const updateItemAverageRating = async (itemType: string, itemId: string) => {
  let reviews;
  
  if (itemType === 'venue') {
    reviews = await Review.find({ itemType: 'venue', venue: itemId });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await Venue.findByIdAndUpdate(itemId, { rating: averageRating });
    }
  } 
  else if (itemType === 'equipment') {
    // If equipment needs ratings in the future, implement here
  } 
  else if (itemType === 'tutorial') {
    // If tutorials need ratings in the future, implement here
  }
};

export default {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  respondToReview,
  getReviewsForItem,
}; 