import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public auth endpoints with rate limiting
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

// Protected auth endpoint
router.get('/me', authenticate, getMe);

export default router;
