import express, { Request, Response } from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import adminBookingController from '../controllers/adminBookingController';
import adminController from '../controllers/adminController';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);
router.use(admin);

// Simple route to verify admin API access
router.get('/ping', adminController.pingAdminAPI);

// Data migration route
router.post('/migrate-data', adminController.migrateData);

// Admin booking routes
router.get('/bookings', adminBookingController.getAdminBookings);
router.patch('/booking-status', adminBookingController.updateBookingStatus);

export default router; 