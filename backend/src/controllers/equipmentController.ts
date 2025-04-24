import { Request, Response } from 'express';
import Equipment, { IEquipment } from '../models/Equipment';

// @desc    Get all equipment with pagination and filters
// @route   GET /api/equipment
// @access  Public
export const getEquipment = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filterObj: any = {};

    // Apply filters if provided
    if (req.query.category) {
      filterObj.category = req.query.category;
    }

    if (req.query.sportType) {
      filterObj.sportType = req.query.sportType;
    }

    if (req.query.brand) {
      filterObj.brand = req.query.brand;
    }

    if (req.query.availability) {
      filterObj.availability = req.query.availability;
    }

    if (req.query.condition) {
      filterObj.condition = req.query.condition;
    }

    if (req.query.minPrice && req.query.maxPrice) {
      filterObj.purchasePrice = {
        $gte: parseInt(req.query.minPrice as string),
        $lte: parseInt(req.query.maxPrice as string),
      };
    } else if (req.query.minPrice) {
      filterObj.purchasePrice = { $gte: parseInt(req.query.minPrice as string) };
    } else if (req.query.maxPrice) {
      filterObj.purchasePrice = { $lte: parseInt(req.query.maxPrice as string) };
    }

    // Search functionality
    if (req.query.search) {
      filterObj.$text = { $search: req.query.search as string };
    }

    // Execute query
    const equipment = await Equipment.find(filterObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Equipment.countDocuments(filterObj);

    res.json({
      equipment,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error: any) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      message: 'Server error fetching equipment',
      error: error.message,
    });
  }
};

// @desc    Get single equipment by ID
// @route   GET /api/equipment/:id
// @access  Public
export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (equipment) {
      res.json(equipment);
    } else {
      res.status(404).json({ message: 'Equipment not found' });
    }
  } catch (error: any) {
    console.error('Get equipment by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching equipment',
      error: error.message,
    });
  }
};

// @desc    Create a new equipment
// @route   POST /api/equipment
// @access  Private/Admin
export const createEquipment = async (req: Request, res: Response) => {
  try {
    const equipmentData = {
      ...req.body,
      creator: req.user?.id
    };

    const equipment = await Equipment.create(equipmentData);

    res.status(201).json(equipment);
  } catch (error: any) {
    console.error('Create equipment error:', error);
    res.status(500).json({
      message: 'Server error creating equipment',
      error: error.message,
    });
  }
};

// @desc    Update an equipment
// @route   PUT /api/equipment/:id
// @access  Private/Admin
export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Update equipment data
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedEquipment);
  } catch (error: any) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      message: 'Server error updating equipment',
      error: error.message,
    });
  }
};

// @desc    Delete an equipment
// @route   DELETE /api/equipment/:id
// @access  Private/Admin
export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    await equipment.deleteOne();
    res.json({ message: 'Equipment removed' });
  } catch (error: any) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      message: 'Server error deleting equipment',
      error: error.message,
    });
  }
};

// @desc    Update equipment inventory (quantity)
// @route   PATCH /api/equipment/:id/inventory
// @access  Private/Admin
export const updateInventory = async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Update quantity and availability status
    equipment.quantity = quantity;
    
    // Update availability based on quantity
    if (quantity === 0) {
      equipment.availability = 'Out of Stock';
    } else if (quantity < 5) {
      equipment.availability = 'Low Stock';
    } else {
      equipment.availability = 'In Stock';
    }

    await equipment.save();

    res.json(equipment);
  } catch (error: any) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      message: 'Server error updating inventory',
      error: error.message,
    });
  }
};

export default {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  updateInventory,
}; 