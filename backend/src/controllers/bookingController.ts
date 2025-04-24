import { Request, Response } from 'express';
import Booking, { IBooking } from '../models/Booking';
import Venue from '../models/Venue';
import Equipment from '../models/Equipment';
import mongoose from 'mongoose';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { itemType, itemId, date, timeSlot, notes, subtotalPrice, totalPrice } = req.body;
    
    // Validate required fields
    if (!itemType || !itemId || !date) {
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
          return res.status(404).json({ message: 'Venue not found' });
        }

        // Check if venue is already booked for this time
        const existingBooking = await Booking.findOne({
          venue: itemId,
          date: { $eq: new Date(date) },
          status: { $in: ['pending', 'confirmed'] },
          ...(timeSlot && {
            'timeSlot.start': timeSlot.start,
            'timeSlot.end': timeSlot.end
          })
        });

        if (existingBooking) {
          return res.status(400).json({ message: 'This venue is already booked for the selected time' });
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
          return res.status(404).json({ message: 'One or more equipment items not found' });
        }

        // Check if any equipment is already booked
        const existingBooking = await Booking.findOne({
          equipment: { $in: equipmentIds },
          date: { $eq: new Date(date) },
          status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
          return res.status(400).json({ message: 'One or more equipment items are already booked for the selected date' });
        }

        // Calculate total price based on daily rental prices
        calculatedTotalPrice = equipment.reduce((sum, item) => sum + item.rentalPriceDaily, 0);
        calculatedSubtotalPrice = calculatedTotalPrice;
      }
      
      else {
        return res.status(400).json({ message: 'Invalid item type' });
      }
      
      // Set the calculated prices
      bookingData.subtotalPrice = calculatedSubtotalPrice;
      bookingData.totalPrice = calculatedTotalPrice;
    }
    
    // Create the booking
    const booking = await Booking.create(bookingData);

    // Populate user and item details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('venue')
      .populate('equipment');

    res.status(201).json(populatedBooking);
  } catch (error: any) {
    console.error('Create booking error:', error);
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

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private/Admin
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    // Validate that the status is one of the allowed values
    if (!status || !['pending', 'confirmed', 'canceled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status' });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Permission check: Regular users can only cancel their own bookings
    if (req.user!.role !== 'admin' && status !== 'canceled') {
      return res.status(403).json({ message: 'You do not have permission to update this booking status' });
    }
    
    // Permission check: Regular users can only update their own bookings
    if (req.user!.role !== 'admin' && booking.user.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'You do not have permission to update this booking' });
    }
    
    // Update the status
    booking.status = status;
    await booking.save();
    
    // Handle any side effects (notifications, etc.)
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status' });
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

export default {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
  createVenueBooking,
  createEquipmentBooking,
  updateBookingStatus,
  updatePaymentStatus,
  handlePaymentSuccess
}; 