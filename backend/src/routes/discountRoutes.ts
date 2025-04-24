import express from 'express';
import {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
} from '../controllers/discountController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Routes that require authentication
router.use(authenticate);

// Validate discount code (for users)
router.post('/validate', validateDiscount);

// Admin-only routes
router.get('/', authorize('admin'), getAllDiscounts);
router.post('/', authorize('admin'), createDiscount);
router.put('/:id', authorize('admin'), updateDiscount);
router.delete('/:id', authorize('admin'), deleteDiscount);

export default router; 