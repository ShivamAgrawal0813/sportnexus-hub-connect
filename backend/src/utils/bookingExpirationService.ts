import Booking from '../models/Booking';
import logger from './logger';

// Maximum time a booking can remain in 'pending' status without payment (in hours)
const BOOKING_EXPIRATION_HOURS = 24;

/**
 * Expire pending bookings older than the configured time limit
 */
export const expirePendingBookings = async (): Promise<void> => {
  try {
    logger.info('Running expiration check for pending bookings');

    // Calculate the cutoff time (24 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - BOOKING_EXPIRATION_HOURS);

    // Find all pending bookings that are older than the cutoff time and haven't been paid
    const pendingBookings = await Booking.find({
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: { $lt: cutoffTime }
    });

    logger.info(`Found ${pendingBookings.length} pending bookings to expire`);

    // Update all expired bookings to 'canceled' status
    const updatePromises = pendingBookings.map(booking => {
      logger.debug(`Expiring booking ${booking._id}`, {
        bookingId: booking._id,
        userId: booking.user,
        createdAt: booking.createdAt
      });

      return Booking.findByIdAndUpdate(
        booking._id,
        { 
          status: 'canceled',
          $set: {
            'metadata.expirationReason': 'Payment not received within 24 hours',
            'metadata.expiredAt': new Date()
          }
        },
        { new: true }
      );
    });

    // Execute all updates
    const results = await Promise.all(updatePromises);
    const expiredCount = results.filter(Boolean).length;

    logger.info(`Successfully expired ${expiredCount} pending bookings`);
    
    // Return any errors that occurred during the update
    const errors = results.filter(result => !result);
    if (errors.length > 0) {
      logger.warn(`Failed to expire ${errors.length} bookings`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error expiring pending bookings', { error: errorMessage });
  }
};

/**
 * Schedule the booking expiration job to run periodically
 */
export const scheduleBookingExpirationJob = (): NodeJS.Timeout => {
  // Run immediately for the first time
  expirePendingBookings().catch(error => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error in initial booking expiration job', { error: errorMessage });
  });

  // Schedule to run every hour
  const ONE_HOUR = 60 * 60 * 1000;
  const timer = setInterval(() => {
    expirePendingBookings().catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error in scheduled booking expiration job', { error: errorMessage });
    });
  }, ONE_HOUR);

  logger.info('Booking expiration scheduler initialized');
  return timer;
};

export default {
  expirePendingBookings,
  scheduleBookingExpirationJob
}; 