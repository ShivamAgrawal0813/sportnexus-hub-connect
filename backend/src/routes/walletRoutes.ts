import express from 'express';
import {
  getWallet,
  addFunds,
  processWalletFunding,
  getTransactions,
  updateWalletCurrency
} from '../controllers/walletController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// All wallet routes require authentication
router.use(authenticate);

// Get user's wallet
router.get('/', getWallet);

// Add funds to wallet
router.post('/funds', addFunds);

// Process successful wallet funding
router.post('/funds/process', processWalletFunding);

// Get wallet transaction history
router.get('/transactions', getTransactions);

// Update wallet currency
router.post('/currency', updateWalletCurrency);

export default router; 