import express from 'express';
import {
  register,
  login,
  getProfile,
  registerValidation,
  loginValidation
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes (with strict rate limiting)
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);

// Protected routes
router.get('/me', authenticate, getProfile);

export default router;
