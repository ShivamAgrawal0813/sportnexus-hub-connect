import { Request, Response } from 'express';
import Venue from '../models/Venue';
import Equipment from '../models/Equipment';

// @desc    Check admin API access
// @route   GET /api/admin/ping
// @access  Private/Admin
export const pingAdminAPI = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Admin API access confirmed',
      user: {
        id: req.user?.id,
        role: req.user?.role
      }
    });
  } catch (error: any) {
    console.error('Admin ping error:', error);
    res.status(500).json({
      message: 'Server error checking admin access',
      error: error.message
    });
  }
};

// @desc    Migrate existing venues and equipment data to add creator field
// @route   POST /api/admin/migrate-data
// @access  Private/Admin
export const migrateData = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Not authorized, missing admin ID' });
    }
    
    // Update venues without creator field
    const venueUpdateResult = await Venue.updateMany(
      { creator: { $exists: false } },
      { $set: { creator: adminId } }
    );
    
    // Update equipment without creator field
    const equipmentUpdateResult = await Equipment.updateMany(
      { creator: { $exists: false } },
      { $set: { creator: adminId } }
    );
    
    res.json({
      success: true,
      message: 'Data migration completed successfully',
      data: {
        venues: venueUpdateResult.modifiedCount,
        equipment: equipmentUpdateResult.modifiedCount
      }
    });
  } catch (error: any) {
    console.error('Data migration error:', error);
    res.status(500).json({
      message: 'Server error performing data migration',
      error: error.message
    });
  }
};

export default {
  pingAdminAPI,
  migrateData
}; 