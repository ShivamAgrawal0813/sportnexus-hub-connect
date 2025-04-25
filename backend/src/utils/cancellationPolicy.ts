import { differenceInHours, differenceInDays } from 'date-fns';
import logger from './logger';

export interface CancellationFeeResult {
  canCancel: boolean;
  refundPercentage: number;
  refundAmount: number;
  cancellationFee: number;
  reason: string;
}

// Cancellation timeframes
const VENUE_CANCEL_HOURS = 24;  // 24 hours before for venues
const EQUIPMENT_CANCEL_DAYS = 2; // 2 days before for equipment

/**
 * Calculate refund amount based on cancellation policy for venues
 * 
 * - Cancellations more than 24 hours before: Full refund
 * - Cancellations between 24 and 12 hours before: 80% refund
 * - Cancellations between 12 and 6 hours before: 50% refund 
 * - Cancellations less than 6 hours before: No refund
 */
export const calculateVenueCancellationFee = (
  bookingDate: Date,
  currentDate: Date = new Date(),
  totalAmount: number
): CancellationFeeResult => {
  const hoursUntilBooking = differenceInHours(bookingDate, currentDate);
  
  logger.debug('Calculating venue cancellation fee', { 
    bookingDate, 
    hoursUntilBooking, 
    totalAmount 
  });

  // Can't cancel past bookings
  if (hoursUntilBooking < 0) {
    return {
      canCancel: false,
      refundPercentage: 0,
      refundAmount: 0,
      cancellationFee: totalAmount,
      reason: 'Booking date has passed, cancellation not allowed'
    };
  }

  // Cancellation more than 24 hours before - Full refund
  if (hoursUntilBooking >= 24) {
    return {
      canCancel: true,
      refundPercentage: 100,
      refundAmount: totalAmount,
      cancellationFee: 0,
      reason: 'Cancelled more than 24 hours in advance - Full refund'
    };
  }

  // Cancellation between 24 and 12 hours before - 80% refund
  if (hoursUntilBooking >= 12) {
    const refundAmount = totalAmount * 0.8;
    return {
      canCancel: true,
      refundPercentage: 80,
      refundAmount,
      cancellationFee: totalAmount - refundAmount,
      reason: 'Cancelled between 12-24 hours in advance - 80% refund'
    };
  }

  // Cancellation between 12 and 6 hours before - 50% refund
  if (hoursUntilBooking >= 6) {
    const refundAmount = totalAmount * 0.5;
    return {
      canCancel: true,
      refundPercentage: 50,
      refundAmount,
      cancellationFee: totalAmount - refundAmount,
      reason: 'Cancelled between 6-12 hours in advance - 50% refund'
    };
  }

  // Less than 6 hours before - No refund
  return {
    canCancel: true,
    refundPercentage: 0,
    refundAmount: 0,
    cancellationFee: totalAmount,
    reason: 'Cancelled less than 6 hours in advance - No refund'
  };
};

/**
 * Calculate refund amount based on cancellation policy for equipment rentals
 * 
 * - Cancellations more than 2 days before: Full refund
 * - Cancellations between 2 days and 1 day before: 70% refund
 * - Cancellations less than 1 day before: No refund
 */
export const calculateEquipmentCancellationFee = (
  bookingDate: Date,
  currentDate: Date = new Date(),
  totalAmount: number
): CancellationFeeResult => {
  const daysUntilBooking = differenceInDays(bookingDate, currentDate);
  
  logger.debug('Calculating equipment cancellation fee', { 
    bookingDate, 
    daysUntilBooking, 
    totalAmount 
  });

  // Can't cancel past bookings
  if (daysUntilBooking < 0) {
    return {
      canCancel: false,
      refundPercentage: 0,
      refundAmount: 0,
      cancellationFee: totalAmount,
      reason: 'Booking date has passed, cancellation not allowed'
    };
  }

  // Cancellation more than 2 days before - Full refund
  if (daysUntilBooking >= 2) {
    return {
      canCancel: true,
      refundPercentage: 100,
      refundAmount: totalAmount,
      cancellationFee: 0,
      reason: 'Cancelled more than 2 days in advance - Full refund'
    };
  }

  // Cancellation between 1-2 days before - 70% refund
  if (daysUntilBooking >= 1) {
    const refundAmount = totalAmount * 0.7;
    return {
      canCancel: true,
      refundPercentage: 70,
      refundAmount,
      cancellationFee: totalAmount - refundAmount,
      reason: 'Cancelled between 1-2 days in advance - 70% refund'
    };
  }

  // Less than 1 day before - No refund
  return {
    canCancel: true,
    refundPercentage: 0,
    refundAmount: 0,
    cancellationFee: totalAmount,
    reason: 'Cancelled less than 1 day in advance - No refund'
  };
};

/**
 * Calculate refund amount based on the item type and booking date
 */
export const calculateCancellationFee = (
  itemType: string,
  bookingDate: Date,
  totalAmount: number,
  currentDate: Date = new Date()
): CancellationFeeResult => {
  switch (itemType.toLowerCase()) {
    case 'venue':
      return calculateVenueCancellationFee(bookingDate, currentDate, totalAmount);
    case 'equipment':
      return calculateEquipmentCancellationFee(bookingDate, currentDate, totalAmount);
    case 'tutorial':
      // Tutorials might have different policies, but for now use same as equipment
      return calculateEquipmentCancellationFee(bookingDate, currentDate, totalAmount);
    default:
      logger.warn('Unknown item type for cancellation policy', { itemType });
      // Default policy - 24 hours for full refund
      const hoursUntilBooking = differenceInHours(bookingDate, currentDate);
      if (hoursUntilBooking < 0) {
        return {
          canCancel: false,
          refundPercentage: 0,
          refundAmount: 0,
          cancellationFee: totalAmount,
          reason: 'Booking date has passed, cancellation not allowed'
        };
      } else if (hoursUntilBooking >= 24) {
        return {
          canCancel: true,
          refundPercentage: 100,
          refundAmount: totalAmount,
          cancellationFee: 0,
          reason: 'Cancelled more than 24 hours in advance - Full refund'
        };
      } else {
        return {
          canCancel: true,
          refundPercentage: 0,
          refundAmount: 0, 
          cancellationFee: totalAmount,
          reason: 'Cancelled less than 24 hours in advance - No refund'
        };
      }
  }
};

export default {
  calculateCancellationFee,
  calculateVenueCancellationFee,
  calculateEquipmentCancellationFee
}; 