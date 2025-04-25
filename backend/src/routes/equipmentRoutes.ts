import express from 'express';
import {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  updateInventory,
} from '../controllers/equipmentController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// @route   GET /api/equipment
router.get('/', getEquipment);

// @route   GET /api/equipment/:id
router.get('/:id', getEquipmentById);

// @route   POST /api/equipment
router.post('/', protect, admin, createEquipment);

// @route   PUT /api/equipment/:id
router.put('/:id', protect, admin, updateEquipment);

// @route   DELETE /api/equipment/:id
router.delete('/:id', protect, admin, deleteEquipment);

// @route   PATCH /api/equipment/:id/inventory
router.patch('/:id/inventory', protect, admin, updateInventory);

export default router; 