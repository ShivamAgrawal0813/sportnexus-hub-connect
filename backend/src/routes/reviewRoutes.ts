import express from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  respondToReview,
  getReviewsForItem,
} from '../controllers/reviewController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getReviews);

// Type-specific review routes (for frontend)
router.get('/:type/:id', getReviewsForItem);
router.post('/:type/:id', protect, createReview);

// Protected routes
router.post('/', protect, createReview);

// @route   GET /api/reviews/detail/:id
router.get('/detail/:id', getReviewById);

// @route   PUT /api/reviews/:id
router.put('/:id', protect, updateReview);

// @route   DELETE /api/reviews/:id
router.delete('/:id', protect, deleteReview);

// @route   POST /api/reviews/:id/respond
router.post('/:id/respond', protect, admin, respondToReview);

// @route   POST /api/reviews/:id/like
router.post('/:id/like', protect, (req, res) => {
  // This is a placeholder for the like feature
  res.json({ success: true, message: 'Review liked successfully' });
});

export default router; 