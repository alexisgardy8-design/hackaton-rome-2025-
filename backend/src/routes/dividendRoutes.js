import express from 'express';
import { 
  createDividend, 
  getCampaignDividends, 
  getDividendDetails, 
  getDividendStatus 
} from '../controllers/dividendController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { dividendLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Create dividend (STARTUP only, with strict rate limiting)
router.post(
  '/dividends/create',
  authenticate,
  authorize(['STARTUP']),
  dividendLimiter,
  createDividend
);

// Get all dividends for a campaign
router.get(
  '/campaigns/:campaignId/dividends',
  getCampaignDividends
);

// Get dividend details
router.get(
  '/dividends/:id',
  getDividendDetails
);

// Get dividend status (for frontend polling)
router.get(
  '/dividends/:id/status',
  getDividendStatus
);

export default router;
