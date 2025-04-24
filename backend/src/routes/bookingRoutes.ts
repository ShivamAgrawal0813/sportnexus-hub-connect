import express from 'express';
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
  createVenueBooking,
  createEquipmentBooking,
  updateBookingStatus,
  updatePaymentStatus,
  handlePaymentSuccess,
} from '../controllers/bookingController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/bookings
router.post('/', protect, createBooking);

// @route   GET /api/bookings
router.get('/', protect, getUserBookings);

// @route   GET /api/bookings/admin
router.get('/admin', protect, admin, getAllBookings);

// @route   GET /api/bookings/:id
router.get('/:id', protect, getBookingById);

// @route   POST /api/bookings/venue
router.post('/venue', protect, createVenueBooking);

// @route   POST /api/bookings/equipment
router.post('/equipment', protect, createEquipmentBooking);

// @route   PATCH /api/bookings/:id/status
router.patch('/:id/status', protect, updateBookingStatus);

// @route   PATCH /api/bookings/:id/payment
router.patch('/:id/payment', protect, admin, updatePaymentStatus);

// Add route for handling successful payments
router.post('/:id/payment-success', protect, handlePaymentSuccess);

export default router; 