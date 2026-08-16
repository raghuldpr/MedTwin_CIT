import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getAuthenticatedUser } from '../services/auth.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * Handle user registration
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const result = await registerUser({
      name,
      email,
      password,
      role,
    });

    // Record audit log for registration
    await createAuditLog({
      actorUserId: result.user.id,
      actorRole: result.user.role,
      action: AuditAction.AUTH_REGISTER,
      resourceType: AuditResourceType.AUTH,
      resourceId: result.user.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { email: result.user.email, role: result.user.role },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user authentication and login
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({
      email,
      password,
    });

    // Record audit log for successful login
    await createAuditLog({
      actorUserId: result.user.id,
      actorRole: result.user.role,
      action: AuditAction.AUTH_LOGIN_SUCCESS,
      resourceType: AuditResourceType.AUTH,
      resourceId: result.user.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { email: result.user.email, role: result.user.role },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    // Record audit log for failed login attempt
    await createAuditLog({
      actorUserId: null,
      actorRole: 'ANONYMOUS',
      action: AuditAction.AUTH_LOGIN_FAILURE,
      resourceType: AuditResourceType.AUTH,
      outcome: AuditOutcome.FAILURE,
      metadata: {
        attemptedEmail:
          typeof req.body?.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : 'unknown',
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    next(error);
  }
};

/**
 * Retrieve the currently authenticated user's profile
 * GET /api/auth/me
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Unauthorized access', 401);
    }

    const safeUser = await getAuthenticatedUser(req.user.id);

    sendResponse(res, 200, {
      success: true,
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
