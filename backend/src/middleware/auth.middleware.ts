import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { User, SafeUser } from '../models/User';
import { AppError } from './error.middleware';

// Augment Express Request interface with authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

/**
 * Authentication Middleware:
 * 1. Reads the Authorization header (Bearer <token>)
 * 2. Validates JWT signature and expiration
 * 3. Verifies user exists in MongoDB and isActive === true
 * 4. Attaches safe user object to req.user
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing or malformed Authorization header.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token missing.', 401);
    }

    // Verify token & decode payload
    const decoded = verifyAccessToken(token);

    // Verify user in MongoDB
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated. Access denied.', 401);
    }

    // Attach validated safe user representation
    req.user = user.toSafeUser();
    next();
  } catch (error) {
    next(error);
  }
};
