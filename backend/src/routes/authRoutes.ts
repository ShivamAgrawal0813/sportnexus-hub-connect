import express, { RequestHandler } from 'express';
import { 
  register, 
  login, 
  getCurrentUser, 
  updateProfile,
  addToFavorites,
  removeFromFavorites,
  createAdmin
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', register as RequestHandler);

// @route   POST /api/auth/login
router.post('/login', login as RequestHandler);

// @route   GET /api/auth/me
router.get('/me', protect as RequestHandler, getCurrentUser as RequestHandler);

// @route   PUT /api/auth/profile
router.put('/profile', protect as RequestHandler, updateProfile as RequestHandler);

// @route   POST /api/auth/favorites/:type/:id
router.post('/favorites/:type/:id', protect as RequestHandler, addToFavorites as RequestHandler);

// @route   DELETE /api/auth/favorites/:type/:id
router.delete('/favorites/:type/:id', protect as RequestHandler, removeFromFavorites as RequestHandler);

// @route   POST /api/auth/create-admin
router.post('/create-admin', createAdmin as RequestHandler);

export default router; 