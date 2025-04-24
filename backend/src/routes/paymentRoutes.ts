import express from 'express';
import {
  createPayment,
  handleStripeWebhook,
  getPaymentHistory,
  processRefund,
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import bodyParser from 'body-parser';

const router = express.Router();

// Routes that require authentication
router.use(authenticate);

// Create a payment intent
router.post('/', createPayment);

// Get payment history
router.get('/history', getPaymentHistory);

// Process refund (admin only)
router.post('/refund', authorize('admin'), processRefund);

// Stripe webhook route - needs raw body for signature verification
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router; 