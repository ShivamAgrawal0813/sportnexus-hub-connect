import { addDays, startOfDay, endOfDay } from 'date-fns';
import Booking from '../models/Booking';
import User from '../models/User';
import Venue from '../models/Venue';
import Equipment from '../models/Equipment';
import Tutorial from '../models/Tutorial';
import emailService from './emailService';
import logger from './logger';

// Get item name by type and ID
const getItemNameById = async (itemType: string, itemId: any): Promise<string> => {
  try {
    switch (itemType) {
      case 'venue':
        const venue = await Venue.findById(itemId);
        return venue ? venue.name : 'Unknown Venue';
      case 'equipment':
        const equipment = await Equipment.findById(itemId);
        return equipment ? equipment.name : 'Unknown Equipment';
      case 'tutorial':
        const tutorial = await Tutorial.findById(itemId);
        return tutorial ? tutorial.title : 'Unknown Tutorial';
      default:
        return 'Unknown Item';
    }
  } catch (error) {
    logger.error('Error getting item name', { 
      error: error instanceof Error ? error.message : String(error),
      itemType,
      itemId
    });
    return 'Unknown Item';
  }
};

/**
 * Find bookings scheduled for tomorrow and send reminder emails
 */
export const sendBookingReminders = async (): Promise<void> => {
  try {
    // Calculate tomorrow's date
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);
    
    logger.info('Checking for bookings to send reminders', {
      date: tomorrowStart.toISOString().split('T')[0]
    });

    // Find all confirmed bookings for tomorrow
    const bookings = await Booking.find({
      date: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: 'confirmed',
      'metadata.reminderSent': { $ne: true } // Only send reminder once
    });

    logger.info(`Found ${bookings.length} bookings for tomorrow that need reminders`);

    // Process each booking
    for (const booking of bookings) {
      try {
        // Get user information
        const user = await User.findById(booking.user);
        if (!user) {
          logger.warn('User not found for booking reminder', { 
            bookingId: booking._id, 
            userId: booking.user 
          });
          continue;
        }

        // Get item name
        let itemName = '';
        if (booking.itemType === 'venue' && booking.venue) {
          itemName = await getItemNameById('venue', booking.venue);
        } else if (booking.itemType === 'equipment' && booking.equipment) {
          const equipmentId = Array.isArray(booking.equipment) 
            ? booking.equipment[0] 
            : booking.equipment;
          itemName = await getItemNameById('equipment', equipmentId);
        } else if (booking.itemType === 'tutorial' && booking.tutorial) {
          itemName = await getItemNameById('tutorial', booking.tutorial);
        }

        // Send reminder email
        logger.debug('Sending booking reminder', { 
          bookingId: booking._id, 
          userId: user._id,
          email: user.email
        });
        
        await emailService.sendBookingReminderEmail(
          user.email,
          user.name,
          {
            bookingId: booking._id.toString(),
            itemType: booking.itemType,
            itemName,
            date: booking.date,
            timeSlot: booking.timeSlot
          }
        );

        // Mark reminder as sent
        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            'metadata.reminderSent': true,
            'metadata.reminderSentAt': new Date()
          }
        });
        
        logger.info('Booking reminder sent successfully', { bookingId: booking._id });
      } catch (error) {
        logger.error('Error sending booking reminder for specific booking', {
          error: error instanceof Error ? error.message : String(error),
          bookingId: booking._id
        });
      }
    }
  } catch (error) {
    logger.error('Error sending booking reminders', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Schedule booking reminders to run daily
 */
export const scheduleBookingReminders = (): NodeJS.Timeout => {
  // Run immediately for the first time
  sendBookingReminders().catch(error => {
    logger.error('Error in initial booking reminder job', {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  // Schedule to run once daily at a specific time (9 AM)
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  const timer = setInterval(() => {
    const now = new Date();
    // Only run at approximately 9 AM
    if (now.getHours() === 9 && now.getMinutes() < 5) {
      sendBookingReminders().catch(error => {
        logger.error('Error in scheduled booking reminder job', {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }
  }, 60 * 60 * 1000); // Check every hour
  
  logger.info('Booking reminder scheduler initialized');
  return timer;
};

export default {
  sendBookingReminders,
  scheduleBookingReminders
}; 