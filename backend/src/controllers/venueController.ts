import { Request, Response } from 'express';
import Venue, { IVenue } from '../models/Venue';

// @desc    Get all venues with pagination and filters
// @route   GET /api/venues
// @access  Public
export const getVenues = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filterObj: any = {};

    // Apply filters if provided
    if (req.query.sportType) {
      filterObj.sportTypes = { $in: [req.query.sportType] };
    }

    if (req.query.city) {
      filterObj.city = req.query.city;
    }

    if (req.query.minPrice && req.query.maxPrice) {
      filterObj.pricePerHour = {
        $gte: parseInt(req.query.minPrice as string),
        $lte: parseInt(req.query.maxPrice as string),
      };
    } else if (req.query.minPrice) {
      filterObj.pricePerHour = { $gte: parseInt(req.query.minPrice as string) };
    } else if (req.query.maxPrice) {
      filterObj.pricePerHour = { $lte: parseInt(req.query.maxPrice as string) };
    }

    // Search functionality
    if (req.query.search) {
      filterObj.$text = { $search: req.query.search as string };
    }

    // Execute query
    const venues = await Venue.find(filterObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Venue.countDocuments(filterObj);

    res.json({
      venues,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error: any) {
    console.error('Get venues error:', error);
    res.status(500).json({
      message: 'Server error fetching venues',
      error: error.message,
    });
  }
};

// @desc    Get single venue by ID
// @route   GET /api/venues/:id
// @access  Public
export const getVenueById = async (req: Request, res: Response) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (venue) {
      res.json(venue);
    } else {
      res.status(404).json({ message: 'Venue not found' });
    }
  } catch (error: any) {
    console.error('Get venue by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching venue',
      error: error.message,
    });
  }
};

// @desc    Create a new venue
// @route   POST /api/venues
// @access  Private/Admin
export const createVenue = async (req: Request, res: Response) => {
  try {
    const venueData = {
      ...req.body,
      creator: req.user?.id
    };

    const venue = await Venue.create(venueData);

    res.status(201).json(venue);
  } catch (error: any) {
    console.error('Create venue error:', error);
    res.status(500).json({
      message: 'Server error creating venue',
      error: error.message,
    });
  }
};

// @desc    Update a venue
// @route   PUT /api/venues/:id
// @access  Private/Admin
export const updateVenue = async (req: Request, res: Response) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Update venue data
    const updatedVenue = await Venue.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedVenue);
  } catch (error: any) {
    console.error('Update venue error:', error);
    res.status(500).json({
      message: 'Server error updating venue',
      error: error.message,
    });
  }
};

// @desc    Delete a venue
// @route   DELETE /api/venues/:id
// @access  Private/Admin
export const deleteVenue = async (req: Request, res: Response) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    await venue.deleteOne();
    res.json({ message: 'Venue removed' });
  } catch (error: any) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      message: 'Server error deleting venue',
      error: error.message,
    });
  }
};

export default {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
}; 