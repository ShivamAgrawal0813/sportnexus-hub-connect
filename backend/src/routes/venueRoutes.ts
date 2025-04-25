import express from 'express';
import {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
} from '../controllers/venueController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// @route   GET /api/venues
router.get('/', getVenues);

// @route   GET /api/venues/:id
router.get('/:id', getVenueById);

// @route   POST /api/venues
router.post('/', protect, admin, createVenue);

// @route   PUT /api/venues/:id
router.put('/:id', protect, admin, updateVenue);

// @route   DELETE /api/venues/:id
router.delete('/:id', protect, admin, deleteVenue);

export default router; 