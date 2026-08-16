import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../utils/roles';
import { AppError } from './error.middleware';

/**
 * Role-Based Access Control (RBAC) Authorization Middleware:
 * Verifies that the authenticated user (from req.user) possesses one of the allowed roles.
 * Must be mounted AFTER authenticate() middleware.
 *
 * @param allowedRoles List of UserRole values permitted to access the route
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Ensure authentication has occurred
    if (!req.user || !req.user.role) {
      return next(
        new AppError('Authentication required. Please authenticate before requesting this resource.', 401)
      );
    }

    // Check if the user's role matches any of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to access this resource.', 403)
      );
    }

    next();
  };
};
