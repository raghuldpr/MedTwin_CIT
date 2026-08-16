import { Router } from 'express';
import { processVoiceCommandHandler } from '../controllers/voiceCommand.controller';
import { authenticate } from '../middleware/auth.middleware';
import { voiceRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Apply Authentication to all voice routes
router.use(authenticate);

// POST /api/voice/command with rate limiter
router.post('/command', voiceRateLimiter, processVoiceCommandHandler);

export default router;
