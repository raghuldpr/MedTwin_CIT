import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  listUsers,
  getUserById,
  updateUserStatus,
  updateDoctorVerification,
} from '../services/admin.service';
import { createAuditLog } from '../services/auditLog.service';
import {
  AuditAction,
  AuditResourceType,
  AuditOutcome,
} from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * GET /api/admin/users
 * List and search users across roles and statuses.
 */
export const listUsersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, role, status, page, limit } = req.query;

    const result = await listUsers({
      search: typeof search === 'string' ? search : undefined,
      role: typeof role === 'string' ? role : undefined,
      status: typeof status === 'string' ? status : undefined,
      page: typeof page === 'string' ? page : undefined,
      limit: typeof limit === 'string' ? limit : undefined,
    });

    await createAuditLog({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || 'UNKNOWN',
      action: AuditAction.ADMIN_USER_LIST,
      resourceType: AuditResourceType.USER,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        searchQueryProvided: !!search,
        roleFilter: role || null,
        statusFilter: status || null,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:userId
 * View details of a specific user.
 */
export const getUserByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await getUserById(userId);

    await createAuditLog({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || 'UNKNOWN',
      action: AuditAction.ADMIN_USER_VIEW,
      resourceType: AuditResourceType.USER,
      resourceId: user.id,
      targetUserId: user.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        targetRole: user.role,
        targetStatus: user.status,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'User details retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:userId/status
 * Activate or Suspend a user account.
 */
export const updateUserStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};

    if (!status || typeof status !== 'string') {
      return next(new AppError('Account status is required.', 400));
    }

    const updatedUser = await updateUserStatus(req.user!.id, userId, status);

    await createAuditLog({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || 'UNKNOWN',
      action: AuditAction.ADMIN_ACCOUNT_STATUS_CHANGE,
      resourceType: AuditResourceType.USER,
      resourceId: updatedUser.id,
      targetUserId: updatedUser.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        newStatus: updatedUser.status,
        isActive: updatedUser.isActive,
        targetRole: updatedUser.role,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: `User account status updated to ${updatedUser.status}`,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/doctors/:doctorId/verification
 * Verify or reject doctor credentials.
 */
export const updateDoctorVerificationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { verificationStatus, rejectionReason } = req.body || {};

    if (!verificationStatus || typeof verificationStatus !== 'string') {
      return next(new AppError('Doctor verification status is required.', 400));
    }

    const updatedDoctor = await updateDoctorVerification(
      req.user!.id,
      doctorId,
      {
        verificationStatus,
        rejectionReason,
      }
    );

    await createAuditLog({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || 'UNKNOWN',
      action: AuditAction.ADMIN_DOCTOR_VERIFICATION,
      resourceType: AuditResourceType.USER,
      resourceId: updatedDoctor.id,
      targetUserId: updatedDoctor.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        verificationStatus:
          updatedDoctor.doctorVerification?.verificationStatus,
        hasRejectionReason: !!updatedDoctor.doctorVerification?.rejectionReason,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: `Doctor verification status updated to ${updatedDoctor.doctorVerification?.verificationStatus}`,
      data: { doctor: updatedDoctor },
    });
  } catch (error) {
    next(error);
  }
};
