import express from 'express';
import {
  getTutorials,
  getTutorialById,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  likeTutorial,
  getEnrolledTutorials,
} from '../controllers/tutorialController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/tutorials
router.get('/', getTutorials);

// @route   GET /api/tutorials/enrolled
router.get('/enrolled', protect, getEnrolledTutorials);

// @route   GET /api/tutorials/:id
router.get('/:id', getTutorialById);

// @route   POST /api/tutorials
router.post('/', protect, admin, createTutorial);

// @route   PUT /api/tutorials/:id
router.put('/:id', protect, updateTutorial);

// @route   DELETE /api/tutorials/:id
router.delete('/:id', protect, deleteTutorial);

// @route   POST /api/tutorials/:id/like
router.post('/:id/like', protect, likeTutorial);

export default router; 