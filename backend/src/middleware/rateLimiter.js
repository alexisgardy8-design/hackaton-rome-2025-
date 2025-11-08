import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Rate limiting middleware configurations
 * Protects API from abuse and DoS attacks
 */

// Custom handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
  logger.security('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  res.status(429).json({
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: req.rateLimit?.resetTime
  });
};

/**
 * Global rate limiter (moderate)
 * Applied to all API routes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  }
});

/**
 * Auth endpoints limiter (very strict)
 * Prevents brute force attacks on login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Investment endpoints limiter (moderate)
 * Prevents spam investment creation
 */
export const investmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 investments per minute
  message: 'Too many investment requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Rate limit per user instead of IP for authenticated endpoints
    return req.user?.id || req.ip;
  }
});

/**
 * Campaign creation limiter (strict)
 * Prevents spam campaign creation
 */
export const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 campaigns per hour
  message: 'Too many campaign creation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Dividend distribution limiter (very strict)
 * Critical operation that costs real money
 */
export const dividendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 dividend distributions per hour
  message: 'Too many dividend distribution requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Token operations limiter (strict)
 * Token issuance and distribution are expensive operations
 */
export const tokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 token operations per hour
  message: 'Too many token operations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * XRPL operations limiter (moderate)
 * Protects wallet and XRPL interactions
 */
export const xrplLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 XRPL operations per minute
  message: 'Too many XRPL requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});
