import express, { RequestHandler } from 'express';
import { 
  register, 
  login, 
  getCurrentUser, 
  updateProfile,
  addToFavorites,
  removeFromFavorites,
  createAdmin,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', register as RequestHandler);

// @route   POST /api/auth/login
router.post('/login', login as RequestHandler);

// @route   GET /api/auth/me
router.get('/me', protect as RequestHandler, getCurrentUser as RequestHandler);

// @route   PUT /api/auth/profile
router.put('/profile', protect as RequestHandler, updateProfile as RequestHandler);

// @route   POST /api/auth/favorites/add
router.post('/favorites/add', protect as RequestHandler, addToFavorites as RequestHandler);

// @route   POST /api/auth/favorites/remove
router.post('/favorites/remove', protect as RequestHandler, removeFromFavorites as RequestHandler);

// @route   POST /api/auth/create-admin
router.post('/create-admin', createAdmin as RequestHandler);

// Password reset routes
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword as RequestHandler);

// @route   POST /api/auth/reset-password
router.post('/reset-password', resetPassword as RequestHandler);

export default router; 