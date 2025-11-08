import express from 'express';
import {
  createInvestmentIntent,
  confirmInvestment,
  getMyInvestments,
  getInvestmentById,
  investValidation,
  confirmInvestmentValidation
} from '../controllers/investmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { investmentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Protected routes - Investor only (with rate limiting)
router.post('/invest', authenticate, authorize('INVESTOR'), investmentLimiter, investValidation, createInvestmentIntent);
router.post('/confirm', authenticate, authorize('INVESTOR'), investmentLimiter, confirmInvestmentValidation, confirmInvestment);

// Protected routes - All authenticated users
router.get('/', authenticate, getMyInvestments);
router.get('/:id', authenticate, getInvestmentById);

export default router;
