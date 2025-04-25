import { Request, Response } from 'express';
import Booking, { IBooking } from '../models/Booking';
import Venue from '../models/Venue';
import Equipment from '../models/Equipment';
import Tutorial from '../models/Tutorial';
import User from '../models/User';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import emailService from '../utils/emailService';

// Helper function to get item name based on type
const getItemNameById = async (
  itemType: string, 
  itemId: string | mongoose.Types.ObjectId
): Promise<string> => {
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
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { itemType, itemId, date, timeSlot, notes, subtotalPrice, totalPrice } = req.body;
    
    logger.debug('Creating new booking', { itemType, itemId, date });
    
    // Validate required fields
    if (!itemType || !itemId || !date) {
      logger.warn('Missing required booking fields', { itemType, itemId, date });
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Calculate price based on item type if not provided
    let calculatedTotalPrice = totalPrice;
    let calculatedSubtotalPrice = subtotalPrice;
    let bookingData: Partial<IBooking> = {
      user: new mongoose.Types.ObjectId(req.user!.id),
      itemType,
      date: new Date(date),
      status: 'pending',
      notes
    };

    // Add the appropriate item ID field based on itemType
    if (itemType === 'venue') {
      bookingData.venue = new mongoose.Types.ObjectId(itemId);
    } else if (itemType === 'equipment') {
      const equipmentIds = Array.isArray(itemId) ? itemId : [itemId];
      bookingData.equipment = equipmentIds.map(id => new mongoose.Types.ObjectId(id));
    } else if (itemType === 'tutorial') {
      bookingData.tutorial = new mongoose.Types.ObjectId(itemId);
    }

    // If prices are provided in the request, use them directly
    if (subtotalPrice !== undefined && totalPrice !== undefined) {
      bookingData.subtotalPrice = subtotalPrice;
      bookingData.totalPrice = totalPrice;
    } else {
      // Otherwise calculate prices based on item type
      
      // Venue booking
      if (itemType === 'venue') {
        const venue = await Venue.findById(itemId);
        if (!venue) {
          logger.warn('Venue not found', { itemId });
          return res.status(404).json({ message: 'Venue not found' });
        }

        // Enhanced check for overlapping bookings
        if (timeSlot) {
          const proposedStartTime = timeSlot.start;
          const proposedEndTime = timeSlot.end;
          
          // Convert time strings to integers for easier comparison (e.g., "09:00" -> 9)
          const proposedStartHour = parseInt(proposedStartTime.split(':')[0]);
          const proposedEndHour = parseInt(proposedEndTime.split(':')[0]);
          
          // Query for any bookings that overlap with the proposed time slot
          const overlappingBooking = await Booking.findOne({
            venue: itemId,
            date: { $eq: new Date(date) },
            status: { $in: ['pending', 'confirmed'] },
            $and: [
              // Existing booking starts before our proposed end time
              { 'timeSlot.start': { $lt: proposedEndTime } },
              // Existing booking ends after our proposed start time
              { 'timeSlot.end': { $gt: proposedStartTime } }
            ]
          });

          if (overlappingBooking) {
            logger.warn('Overlapping booking detected', { 
              venueId: itemId, 
              date, 
              proposedTime: `${proposedStartTime}-${proposedEndTime}`,
              existingTime: `${overlappingBooking.timeSlot?.start}-${overlappingBooking.timeSlot?.end}`
            });
            
            return res.status(400).json({ 
              message: 'This venue is already booked during the selected time period',
              conflictingBooking: {
                start: overlappingBooking.timeSlot?.start,
                end: overlappingBooking.timeSlot?.end
              }
            });
          }
        } else {
          return res.status(400).json({ message: 'Time slot is required for venue bookings' });
        }

        // Calculate price based on venue pricing and duration
        if (timeSlot) {
          const startHour = parseInt(timeSlot.start.split(':')[0]);
          const endHour = parseInt(timeSlot.end.split(':')[0]);
          const duration = endHour - startHour;
          calculatedTotalPrice = venue.pricePerHour * duration;
          calculatedSubtotalPrice = calculatedTotalPrice; // Set subtotal equal to total before any discounts
          bookingData.timeSlot = timeSlot;
        } else {
          // Default to 1 hour if no time slot provided
          calculatedTotalPrice = venue.pricePerHour;
          calculatedSubtotalPrice = calculatedTotalPrice;
        }
      }
      
      // Equipment booking
      else if (itemType === 'equipment') {
        // Handle single equipment or array of equipment
        const equipmentIds = Array.isArray(itemId) ? itemId : [itemId];
        
        // Validate all equipment exists
        const equipment = await Equipment.find({ _id: { $in: equipmentIds } });
        if (equipment.length !== equipmentIds.length) {
          logger.warn('Some equipment not found', { equipmentIds });
          return res.status(404).json({ message: 'One or more equipment items not found' });
        }

        // Check if any equipment is already booked
        const existingBooking = await Booking.findOne({
          equipment: { $in: equipmentIds },
          date: { $eq: new Date(date) },
          status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
          logger.warn('Equipment already booked', { equipmentIds, date });
          return res.status(400).json({ message: 'One or more equipment items are already booked for the selected date' });
        }

        // Calculate total price based on daily rental prices
        calculatedTotalPrice = equipment.reduce((sum, item) => sum + item.rentalPriceDaily, 0);
        calculatedSubtotalPrice = calculatedTotalPrice;
      }
      
      else {
        logger.warn('Invalid item type', { itemType });
        return res.status(400).json({ message: 'Invalid item type' });
      }
      
      // Set the calculated prices
      bookingData.subtotalPrice = calculatedSubtotalPrice;
      bookingData.totalPrice = calculatedTotalPrice;
    }
    
    // Create the booking
    const booking = await Booking.create(bookingData);
    logger.info('Booking created successfully', { bookingId: booking._id, userId: req.user!.id });

    // Populate user and item details for response and email
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('venue')
      .populate('equipment');
    
    // Get user info for email notification
    const user = await User.findById(req.user!.id);
    if (user) {
      // Get item name for the booking
      let itemName = '';
      if (itemType === 'venue' && populatedBooking?.venue) {
        itemName = (populatedBooking.venue as any).name;
      } else if (itemType === 'equipment' && populatedBooking?.equipment) {
        // For equipment, we might have multiple items, just use the first one's name
        const firstEquipment = Array.isArray(populatedBooking.equipment) 
          ? populatedBooking.equipment[0] 
          : populatedBooking.equipment;
        itemName = firstEquipment ? (firstEquipment as any).name : 'Equipment';
      } else {
        // Fallback to fetching the name
        itemName = await getItemNameById(itemType, itemId);
      }

      // Send booking confirmation email
      emailService.sendBookingConfirmationEmail(
        user.email,
        user.name,
        {
          bookingId: booking._id.toString(),
          itemType,
          itemName,
          date: booking.date,
          timeSlot: booking.timeSlot,
          totalPrice: booking.totalPrice
        }
      ).catch(error => {
        logger.error('Failed to send booking confirmation email', { 
          error: error instanceof Error ? error.message : String(error),
          bookingId: booking._id
        });
      });
    }

    res.status(201).json(populatedBooking);
  } catch (error: any) {
    logger.error('Create booking error', { error: error.message });
    res.status(500).json({ 
      message: 'Server error while creating booking',
      error: error.message
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Filter options
    const statusFilter = req.query.status ? { status: req.query.status } : {};
    const itemTypeFilter = req.query.itemType ? { itemType: req.query.itemType } : {};
    
    // Find bookings for the current user
    const bookings = await Booking.find({ 
      user: new mongoose.Types.ObjectId(req.user!.id),
      ...statusFilter,
      ...itemTypeFilter
    })
      .populate('user', 'name email')
      .populate('venue')
      .populate('equipment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Count total bookings for pagination
    const total = await Booking.countDocuments({ 
      user: new mongoose.Types.ObjectId(req.user!.id),
      ...statusFilter,
      ...itemTypeFilter
    });
    
    res.json({
      bookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error: any) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/bookings/admin
// @access  Private/Admin
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Filter options
    const statusFilter = req.query.status ? { status: req.query.status } : {};
    const itemTypeFilter = req.query.itemType ? { itemType: req.query.itemType } : {};
    const dateFilter = req.query.date ? { date: new Date(req.query.date as string) } : {};
    
    // Find all bookings with filters
    const bookings = await Booking.find({ 
      ...statusFilter,
      ...itemTypeFilter,
      ...dateFilter
    })
      .populate('user', 'name email')
      .populate('venue')
      .populate('equipment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Count total bookings for pagination
    const total = await Booking.countDocuments({ 
      ...statusFilter,
      ...itemTypeFilter,
      ...dateFilter
    });
    
    res.json({
      bookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error: any) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching bookings',
      error: error.message
    });
  }
};

// @desc    Update a booking's status
// @route   PATCH /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    logger.debug('Updating booking status', { bookingId: id, status });

    if (!status || !['pending', 'confirmed', 'canceled', 'completed'].includes(status)) {
      logger.warn('Invalid booking status update', { status });
      return res.status(400).json({ message: 'Please provide a valid status' });
    }

    // Find the booking
    const booking = await Booking.findById(id);
    
    if (!booking) {
      logger.warn('Booking not found for status update', { bookingId: id });
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is an admin
    const isOwner = booking.user.toString() === req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Unauthorized booking status update attempt', { 
        bookingId: id, 
        userId: req.user!.id,
        isAdmin
      });
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Update the booking status
    const oldStatus = booking.status;
    booking.status = status;
    
    if (reason) {
      // Store reason in metadata if provided
      booking.metadata = {
        ...booking.metadata,
        statusUpdateReason: reason,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: req.user!.id
      };
    }
    
    await booking.save();
    logger.info('Booking status updated', { 
      bookingId: id, 
      oldStatus, 
      newStatus: status 
    });

    // Send email notification if status changed
    if (oldStatus !== status) {
      // Get user info
      const user = await User.findById(booking.user);
      if (user) {
        // Get item details
        let itemName = '';
        if (booking.itemType === 'venue' && booking.venue) {
          itemName = await getItemNameById('venue', booking.venue);
        } else if (booking.itemType === 'equipment' && booking.equipment) {
          // For equipment, we might have multiple items
          const equipmentId = Array.isArray(booking.equipment) 
            ? booking.equipment[0] 
            : booking.equipment;
          itemName = await getItemNameById('equipment', equipmentId);
        } else if (booking.itemType === 'tutorial' && booking.tutorial) {
          itemName = await getItemNameById('tutorial', booking.tutorial);
        }

        // Send status update email
        emailService.sendBookingStatusUpdateEmail(
          user.email,
          user.name,
          {
            bookingId: booking._id.toString(),
            itemType: booking.itemType,
            itemName,
            date: booking.date,
            timeSlot: booking.timeSlot,
            status,
            reason
          }
        ).catch(error => {
          logger.error('Failed to send booking status update email', { 
            error: error instanceof Error ? error.message : String(error),
            bookingId: booking._id
          });
        });
      }
    }

    res.json({
      success: true,
      booking
    });
  } catch (error: any) {
    logger.error('Update booking status error', { error: error.message });
    res.status(500).json({
      message: 'Server error while updating booking status',
      error: error.message
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req: Request, res: Response) => {
  try {
    console.log(`Fetching booking with ID: ${req.params.id}`);
    console.log(`User ID from token: ${req.user?.id}`);
    console.log(`User role from token: ${req.user?.role}`);
    
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('venue')
      .populate('equipment');
    
    if (!booking) {
      console.log(`Booking not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    console.log(`Booking found. Belongs to user: ${booking.user._id}`);
    
    // Regular users can only view their own bookings
    if (req.user!.role !== 'admin' && booking.user._id.toString() !== req.user!.id) {
      console.log(`Authorization failed. User ${req.user!.id} trying to access booking of user ${booking.user._id}`);
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    res.json(booking);
  } catch (error: any) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching booking',
      error: error.message,
    });
  }
};

// @desc    Create a venue booking
// @route   POST /api/bookings/venue
// @access  Private
export const createVenueBooking = async (req: Request, res: Response) => {
  try {
    const { venueId, date, timeSlot, notes } = req.body;
    
    if (!venueId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Please provide venue, date and time slot' });
    }
    
    // Forward to createBooking with itemType set to venue
    req.body = {
      itemType: 'venue',
      itemId: venueId,
      date,
      timeSlot,
      notes
    };
    
    return createBooking(req, res);
  } catch (error: any) {
    console.error('Create venue booking error:', error);
    res.status(500).json({ 
      message: 'Server error while creating venue booking',
      error: error.message
    });
  }
};

// @desc    Create an equipment booking
// @route   POST /api/bookings/equipment
// @access  Private
export const createEquipmentBooking = async (req: Request, res: Response) => {
  try {
    const { equipmentId, date, notes } = req.body;
    
    if (!equipmentId || !date) {
      return res.status(400).json({ message: 'Please provide equipment and date' });
    }
    
    // Forward to createBooking with itemType set to equipment
    req.body = {
      itemType: 'equipment',
      itemId: equipmentId,
      date,
      notes
    };
    
    return createBooking(req, res);
  } catch (error: any) {
    console.error('Create equipment booking error:', error);
    res.status(500).json({ 
      message: 'Server error while creating equipment booking',
      error: error.message
    });
  }
};

// @desc    Update payment status
// @route   PATCH /api/bookings/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentStatus } = req.body;
    
    if (!paymentStatus || !['pending', 'paid', 'refunded', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Please provide a valid payment status' });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update payment status logic here
    // For now, we'll just assume the booking has a paymentStatus field
    (booking as any).paymentStatus = paymentStatus;
    await booking.save();
    
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('venue')
      .populate('equipment');
    
    res.json(updatedBooking);
  } catch (error: any) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      message: 'Server error while updating payment status',
      error: error.message
    });
  }
};

// @desc    Handle successful payment
// @route   POST /api/bookings/:id/payment-success
// @access  Private
export const handlePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    
    // Find the booking and verify it belongs to the user
    const booking = await Booking.findOne({ 
      _id: bookingId,
      user: userId
    });
    
    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found or does not belong to user'
      });
    }
    
    // Update booking status to confirmed and payment status to paid
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'confirmed',
      paymentStatus: 'paid'
    });
    
    console.log(`Booking ${bookingId} marked as confirmed after successful payment`);
    
    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully'
    });
  } catch (error: any) {
    console.error('Payment success handler error:', error);
    res.status(500).json({ 
      message: 'Server error while confirming booking',
      error: error.message
    });
  }
};

// @desc    Cancel a booking with potential refund
// @route   POST /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    logger.debug('Processing booking cancellation request', { bookingId: id });

    // Find the booking
    const booking = await Booking.findById(id);
    
    if (!booking) {
      logger.warn('Booking not found for cancellation', { bookingId: id });
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is an admin
    const isOwner = booking.user.toString() === req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Unauthorized booking cancellation attempt', { 
        bookingId: id, 
        userId: req.user!.id 
      });
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking is already canceled or completed
    if (booking.status === 'canceled') {
      logger.warn('Attempted to cancel an already canceled booking', { bookingId: id });
      return res.status(400).json({ message: 'Booking is already canceled' });
    }

    if (booking.status === 'completed') {
      logger.warn('Attempted to cancel a completed booking', { bookingId: id });
      return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    // Import cancellation policy dynamically to avoid circular dependencies
    const cancellationPolicy = await import('../utils/cancellationPolicy');
    
    // Calculate refund amount based on the cancellation policy
    const cancellationResult = cancellationPolicy.default.calculateCancellationFee(
      booking.itemType,
      booking.date,
      booking.totalPrice
    );

    // Check if cancellation is allowed
    if (!cancellationResult.canCancel) {
      logger.warn('Cancellation not allowed', { 
        bookingId: id, 
        reason: cancellationResult.reason 
      });
      return res.status(400).json({ 
        message: 'Cancellation not allowed', 
        reason: cancellationResult.reason 
      });
    }

    // Process cancellation
    booking.status = 'canceled';
    booking.metadata = {
      ...booking.metadata,
      cancellationReason: reason || 'Canceled by user',
      canceledAt: new Date(),
      canceledBy: req.user!.id,
      refundPercentage: cancellationResult.refundPercentage,
      refundAmount: cancellationResult.refundAmount,
      cancellationFee: cancellationResult.cancellationFee
    };
    
    await booking.save();
    
    logger.info('Booking canceled successfully', { 
      bookingId: id, 
      refundAmount: cancellationResult.refundAmount, 
      refundPercentage: cancellationResult.refundPercentage 
    });

    // Process refund if applicable
    let refundResult = null;
    if (booking.paymentStatus === 'paid' && cancellationResult.refundAmount > 0) {
      // Import payment service
      const { processRefund } = await import('../utils/paymentService');
      
      // Process the refund
      refundResult = await processRefund({
        userId: booking.user.toString(),
        bookingId: booking._id.toString(),
        amount: cancellationResult.refundAmount,
        reason: `Refund for canceled booking - ${cancellationResult.reason}`
      });
      
      if (refundResult.success) {
        logger.info('Refund processed for canceled booking', { 
          bookingId: id, 
          refundAmount: cancellationResult.refundAmount 
        });
        
        // Update payment status
        booking.paymentStatus = 'refunded';
        await booking.save();
      } else {
        logger.error('Failed to process refund for canceled booking', { 
          bookingId: id, 
          error: refundResult.message 
        });
      }
    }

    // Send cancellation email notification
    try {
      // Get user info
      const user = await User.findById(booking.user);
      if (user) {
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
        
        // Send email notification
        const emailService = await import('../utils/emailService');
        await emailService.default.sendBookingStatusUpdateEmail(
          user.email,
          user.name,
          {
            bookingId: booking._id.toString(),
            itemType: booking.itemType,
            itemName,
            date: booking.date,
            timeSlot: booking.timeSlot,
            status: 'canceled',
            reason: reason || cancellationResult.reason
          }
        );
      }
    } catch (error) {
      logger.error('Failed to send cancellation email', { 
        error: error instanceof Error ? error.message : String(error),
        bookingId: id
      });
      // Don't return an error to the user, just log it
    }

    res.json({
      success: true,
      booking,
      cancellationDetails: {
        refundPercentage: cancellationResult.refundPercentage,
        refundAmount: cancellationResult.refundAmount,
        cancellationFee: cancellationResult.cancellationFee,
        reason: cancellationResult.reason,
        refundProcessed: refundResult?.success || false
      }
    });
  } catch (error: any) {
    logger.error('Booking cancellation error', { error: error.message });
    res.status(500).json({
      message: 'Server error while canceling booking',
      error: error.message
    });
  }
};

export default {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
  createVenueBooking,
  createEquipmentBooking,
  updateBookingStatus,
  updatePaymentStatus,
  handlePaymentSuccess,
  cancelBooking
}; 