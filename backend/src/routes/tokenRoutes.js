import express from 'express';
import { 
  issueToken, 
  distributeTokens, 
  getCampaignToken,
  checkInvestmentTrustline
} from '../controllers/tokenController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { tokenLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/campaigns/:id/issue-token
 * @desc    Issue a token for a campaign
 * @access  Private (STARTUP only, campaign owner)
 */
router.post(
  '/campaigns/:id/issue-token',
  authenticate,
  authorize('STARTUP'),
  tokenLimiter,
  issueToken
);

/**
 * @route   POST /api/campaigns/:id/distribute-tokens
 * @desc    Distribute tokens to investors
 * @access  Private (STARTUP only, campaign owner)
 */
router.post(
  '/campaigns/:id/distribute-tokens',
  authenticate,
  authorize('STARTUP'),
  tokenLimiter,
  distributeTokens
);

/**
 * @route   GET /api/campaigns/:id/token
 * @desc    Get token details for a campaign
 * @access  Public
 */
router.get(
  '/campaigns/:id/token',
  getCampaignToken
);

/**
 * @route   GET /api/investments/:id/trustline-status
 * @desc    Check trustline status for an investment
 * @access  Private (Investor or Campaign Owner)
 */
router.get(
  '/investments/:id/trustline-status',
  authenticate,
  checkInvestmentTrustline
);

export default router;
