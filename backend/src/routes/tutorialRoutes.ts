import express from 'express';
import tutorialController from '../controllers/tutorialController';
import { protect, admin, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
// @route   GET /api/tutorials
router.get('/', tutorialController.getTutorials);

// Protected routes (require login)
router.use(protect);

// @route   GET /api/tutorials/enrolled
router.get('/enrolled', tutorialController.getEnrolledTutorials);

// @route   GET /api/tutorials/:id - needs to come after specific routes
router.get('/:id', tutorialController.getTutorialById);

// @route   POST /api/tutorials/:id/like
router.post('/:id/like', tutorialController.likeTutorial);

// @route   POST /api/tutorials/:id/purchase
router.post('/:id/purchase', tutorialController.purchaseTutorial);

// @route   POST /api/tutorials/:id/payment
router.post('/:id/payment', tutorialController.processTutorialPayment);

// Content creator routes
// @route   POST /api/tutorials
router.post('/', restrictTo('creator', 'admin'), tutorialController.createTutorial);

// @route   PUT /api/tutorials/:id
router.put('/:id', tutorialController.updateTutorial);

// @route   DELETE /api/tutorials/:id
router.delete('/:id', tutorialController.deleteTutorial);

export default router; 