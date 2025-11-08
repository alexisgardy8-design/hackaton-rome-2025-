import express from 'express';
import { releaseCampaignEscrows, checkAndReleaseEscrows } from '../controllers/escrowController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Release escrows for a specific campaign (campaign owner only)
router.post('/release/:campaignId', authenticate, authorize('STARTUP'), releaseCampaignEscrows);

// Check and release escrows for all campaigns that reached 100% (admin or automated)
router.post('/check-and-release', authenticate, checkAndReleaseEscrows);

export default router;

