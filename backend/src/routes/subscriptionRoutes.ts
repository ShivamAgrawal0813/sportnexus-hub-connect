import express from 'express';
import {
  getSubscriptionPlans,
  getUserSubscription,
  createSubscription,
  cancelSubscription,
} from '../controllers/subscriptionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get subscription plans (public)
router.get('/plans', getSubscriptionPlans);

// Routes that require authentication
router.use(protect);

// Get user's subscription
router.get('/', getUserSubscription);

// Create subscription
router.post('/', createSubscription);

// Cancel subscription
router.post('/cancel', cancelSubscription);

export default router; 