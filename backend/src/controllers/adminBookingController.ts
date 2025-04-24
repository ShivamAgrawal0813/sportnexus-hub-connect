import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Venue from '../models/Venue';
import Equipment from '../models/Equipment';
import Tutorial from '../models/Tutorial';
import mongoose from 'mongoose';

// @desc    Get all bookings for admin's items (venues, equipment, tutorials)
// @route   GET /api/admin/bookings
// @access  Private/Admin
export const getAdminBookings = async (req: Request, res: Response) => {
  try {
    console.log('Admin bookings request received');
    
    // Get admin ID from authenticated user
    const adminId = req.user?.id;

    if (!adminId) {
      console.log('No admin ID found in request');
      return res.status(401).json({ message: 'Not authorized, missing admin ID' });
    }

    console.log(`Processing request for admin ID: ${adminId}`);

    // Find venues created by this admin
    const venues = await Venue.find({ creator: adminId });
    console.log(`Found ${venues.length} venues created by this admin`);
    
    // Find equipment created by this admin
    const equipment = await Equipment.find({ creator: adminId });
    console.log(`Found ${equipment.length} equipment items created by this admin`);
    
    // Find tutorials created by this admin
    const tutorials = await Tutorial.find({ author: adminId });
    console.log(`Found ${tutorials.length} tutorials created by this admin`);

    // Get venue IDs and equipment IDs
    const venueIds = venues.map(venue => venue._id);
    const equipmentIds = equipment.map(equip => equip._id);
    const tutorialIds = tutorials.map(tutorial => tutorial._id);
    
    // Get all bookings for admin's venues and equipment
    const venueBookings = await Booking.find({
      venue: { $in: venueIds },
      itemType: 'venue'
    }).populate('user', 'name email').populate('venue');
    console.log(`Found ${venueBookings.length} venue bookings`);
    
    const equipmentBookings = await Booking.find({
      equipment: { $in: equipmentIds },
      itemType: 'equipment'
    }).populate('user', 'name email').populate('equipment');
    console.log(`Found ${equipmentBookings.length} equipment bookings`);
    
    // For tutorial enrollments
    const tutorialEnrollments = await Booking.find({
      tutorial: { $in: tutorialIds },
      itemType: 'tutorial'
    }).populate('user', 'name email').populate('tutorial');
    console.log(`Found ${tutorialEnrollments.length} tutorial enrollments`);
    
    // Log a sample tutorial enrollment for debugging
    if (tutorialEnrollments.length > 0) {
      console.log('Sample tutorial enrollment:', JSON.stringify({
        id: tutorialEnrollments[0]._id,
        user: tutorialEnrollments[0].user?.name,
        tutorial: {
          id: tutorialEnrollments[0].tutorial?._id,
          title: tutorialEnrollments[0].tutorial?.title
        },
        status: tutorialEnrollments[0].status
      }, null, 2));
    }
    
    // Structure response data
    const venueData = venues.map(venue => {
      const bookings = venueBookings.filter(booking => 
        booking.venue && booking.venue._id.toString() === venue._id.toString()
      );
      
      return {
        item: venue,
        type: 'venue',
        bookings
      };
    });
    
    const equipmentData = equipment.map(equip => {
      const bookings = equipmentBookings.filter(booking => 
        booking.equipment && booking.equipment.some(e => e.toString() === equip._id.toString())
      );
      
      return {
        item: equip,
        type: 'equipment',
        bookings
      };
    });
    
    const tutorialData = tutorials.map(tutorial => {
      const enrollments = tutorialEnrollments.filter(enrollment => 
        enrollment.tutorial && enrollment.tutorial._id.toString() === tutorial._id.toString()
      );
      
      return {
        item: tutorial,
        type: 'tutorial',
        bookings: enrollments
      };
    });
    
    // Combine all data
    const responseData = [...venueData, ...equipmentData, ...tutorialData];
    
    console.log('Sending response with counts:', {
      venues: venueData.length,
      equipment: equipmentData.length,
      tutorials: tutorialData.length,
      pendingBookings: [...venueBookings, ...equipmentBookings, ...tutorialEnrollments]
        .filter(b => b.status === 'pending').length,
    });
    
    res.json({
      success: true,
      data: responseData,
      counts: {
        venues: venueData.length,
        equipment: equipmentData.length,
        tutorials: tutorialData.length,
        pendingBookings: [...venueBookings, ...equipmentBookings, ...tutorialEnrollments]
          .filter(b => b.status === 'pending').length,
        confirmedBookings: [...venueBookings, ...equipmentBookings, ...tutorialEnrollments]
          .filter(b => b.status === 'confirmed').length,
        canceledBookings: [...venueBookings, ...equipmentBookings, ...tutorialEnrollments]
          .filter(b => b.status === 'canceled').length,
      }
    });
  } catch (error: any) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({
      message: 'Server error fetching admin bookings',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
    });
  }
};

// @desc    Update booking status (confirm/reject)
// @route   PATCH /api/admin/booking-status
// @access  Private/Admin
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    console.log('Update booking status request received:', req.body);
    
    const { bookingId, status } = req.body;
    const adminId = req.user?.id;
    
    if (!bookingId || !status) {
      return res.status(400).json({ message: 'Booking ID and status are required' });
    }
    
    if (!['pending', 'confirmed', 'canceled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    console.log(`Admin ID: ${adminId}, attempting to update booking ${bookingId} to status: ${status}`);
    
    // Find the booking without running validation 
    const booking = await Booking.findById(bookingId)
      .populate('venue')
      .populate('equipment')
      .populate('tutorial');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    console.log(`Found booking of type: ${booking.itemType}`);
    console.log(`Booking details: ${JSON.stringify({
      id: booking._id,
      user: booking.user,
      itemType: booking.itemType,
      venue: booking.venue?._id,
      equipment: booking.equipment?.map(e => e.toString()),
      tutorial: booking.tutorial?._id,
      status: booking.status
    }, null, 2)}`);
    
    // Check if the admin owns the item
    let isAuthorized = false;
    
    if (booking.itemType === 'venue' && booking.venue) {
      const venue = await Venue.findById(booking.venue);
      console.log(`Venue creator: ${venue?.creator}, Admin ID: ${adminId}`);
      isAuthorized = venue?.creator?.toString() === adminId;
    } else if (booking.itemType === 'equipment' && booking.equipment?.length > 0) {
      // For simplicity, check just the first equipment item
      const equip = await Equipment.findById(booking.equipment[0]);
      console.log(`Equipment creator: ${equip?.creator}, Admin ID: ${adminId}`);
      isAuthorized = equip?.creator?.toString() === adminId;
    } else if (booking.itemType === 'tutorial' && booking.tutorial) {
      const tutorial = await Tutorial.findById(booking.tutorial);
      console.log(`Tutorial details: ${JSON.stringify({
        id: tutorial?._id,
        title: tutorial?.title,
        author: tutorial?.author
      }, null, 2)}`);
      console.log(`Tutorial author: ${tutorial?.author}, Admin ID: ${adminId}`);
      
      // Compare IDs as strings to ensure proper comparison
      const tutorialAuthorId = tutorial?.author ? tutorial.author.toString() : null;
      const adminIdStr = adminId.toString();
      
      console.log(`Comparing: tutorialAuthorId=${tutorialAuthorId}, adminIdStr=${adminIdStr}, equal=${tutorialAuthorId === adminIdStr}`);
      
      isAuthorized = tutorialAuthorId === adminIdStr;
    }
    
    console.log(`Authorization check result: ${isAuthorized}`);
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    
    console.log(`Updating booking ${bookingId} status from ${booking.status} to ${status}`);
    
    // Use findByIdAndUpdate instead of save() to bypass validation
    // This will only update the status field and leave other fields untouched
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { 
        new: true,  // Return the updated document
        runValidators: false  // Don't run validators for this update
      }
    );
    
    console.log('Booking updated successfully');
    
    res.json({
      success: true,
      data: updatedBooking
    });
  } catch (error: any) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      message: 'Server error updating booking status',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
    });
  }
};

export default {
  getAdminBookings,
  updateBookingStatus,
}; 