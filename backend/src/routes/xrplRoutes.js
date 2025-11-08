import express from 'express';
import { getTransaction, getBalance, createTestnetWallet } from '../controllers/xrplController.js';
import { xrplLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   GET /api/xrpl/tx/:hash
 * @desc    Get transaction details by hash (for debugging)
 * @access  Public
 */
router.get('/tx/:hash', xrplLimiter, getTransaction);

/**
 * @route   GET /api/xrpl/balance/:address
 * @desc    Get account balance by address (for debugging)
 * @access  Public
 */
router.get('/balance/:address', xrplLimiter, getBalance);

/**
 * @route   POST /api/xrpl/wallet/generate
 * @desc    Generate new Testnet wallet with funding (TESTNET ONLY!)
 * @access  Public
 */
router.post('/wallet/generate', xrplLimiter, createTestnetWallet);

export default router;

