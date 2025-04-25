import express from 'express';
import {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
} from '../controllers/discountController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Routes that require authentication
router.use(protect);

// Validate discount code (for users)
router.post('/validate', validateDiscount);

// Admin-only routes
router.get('/', restrictTo('admin'), getAllDiscounts);
router.post('/', restrictTo('admin'), createDiscount);
router.put('/:id', restrictTo('admin'), updateDiscount);
router.delete('/:id', restrictTo('admin'), deleteDiscount);

export default router; 