import { Request, Response } from 'express';
import Discount from '../models/Discount';
import { calculateDiscountedAmount } from '../utils/paymentService';

// Get all discounts (admin only)
export const getAllDiscounts = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view all discounts.',
      });
    }
    
    const discounts = await Discount.find()
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      discounts,
    });
  } catch (error) {
    console.error('Get all discounts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve discounts',
      error: error.message,
    });
  }
};

// Create discount (admin only)
export const createDiscount = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create discounts.',
      });
    }
    
    const {
      code,
      type,
      value,
      maxUses,
      expiresAt,
      minOrderValue,
      maxDiscountAmount,
      applicableItems = 'all',
    } = req.body;
    
    if (!code || !type || !value || !maxUses || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing',
      });
    }
    
    // Check if discount code already exists
    const existingDiscount = await Discount.findOne({
      code: code.toUpperCase(),
    });
    
    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: 'Discount code already exists',
      });
    }
    
    // Create new discount
    const discount = await Discount.create({
      code: code.toUpperCase(),
      type,
      value,
      maxUses,
      expiresAt,
      minOrderValue,
      maxDiscountAmount,
      applicableItems,
      isActive: true,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      discount,
    });
  } catch (error) {
    console.error('Create discount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create discount',
      error: error.message,
    });
  }
};

// Update discount (admin only)
export const updateDiscount = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update discounts.',
      });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Find and update the discount
    const discount = await Discount.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      discount,
    });
  } catch (error) {
    console.error('Update discount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update discount',
      error: error.message,
    });
  }
};

// Delete discount (admin only)
export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete discounts.',
      });
    }
    
    const { id } = req.params;
    
    // Find and delete the discount
    const discount = await Discount.findByIdAndDelete(id);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Discount deleted successfully',
    });
  } catch (error) {
    console.error('Delete discount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete discount',
      error: error.message,
    });
  }
};

// Validate discount code
export const validateDiscount = async (req: Request, res: Response) => {
  try {
    const { code, amount, itemType } = req.body;
    
    if (!code || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Code and amount are required',
      });
    }
    
    // Find the discount code
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      currentUses: { $lt: "$maxUses" },
      ...(itemType && { $or: [{ applicableItems: 'all' }, { applicableItems: itemType }] }),
    });
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Invalid discount code or code has expired',
      });
    }
    
    // Calculate discounted amount
    const discountedAmount = await calculateDiscountedAmount(amount, code, itemType);
    
    // Calculate discount value
    const discountValue = amount - discountedAmount;
    
    return res.status(200).json({
      success: true,
      discount,
      originalAmount: amount,
      discountedAmount,
      discountValue,
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate discount',
      error: error.message,
    });
  }
}; 