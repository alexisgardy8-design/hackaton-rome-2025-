import express from 'express';
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  createCampaignValidation
} from '../controllers/campaignController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { campaignLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);

// Protected routes - Startup only (with rate limiting)
router.post('/', authenticate, authorize('STARTUP'), campaignLimiter, createCampaignValidation, createCampaign);
router.put('/:id', authenticate, authorize('STARTUP'), campaignLimiter, updateCampaign);
router.delete('/:id', authenticate, authorize('STARTUP'), deleteCampaign);

export default router;
