import { Request, Response, NextFunction } from 'express';
import {
  generateConsent,
  getPatientConsents,
  revokeConsent,
  verifyDoctorPin,
} from '../services/consent.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/patient/consents
 * Patient generates a secure 6-digit access PIN and consent record.
 */
export const createConsentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { expiresInMinutes, permissionLevel, doctorId } = req.body;

    const result = await generateConsent(req.user.id, {
      expiresInMinutes: expiresInMinutes ? Number(expiresInMinutes) : 60,
      permissionLevel,
      doctorId,
    });

    // Record audit log for consent generation (strictly never logging PIN)
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.CONSENT_CREATE,
      resourceType: AuditResourceType.ACCESS_CONSENT,
      resourceId: result.consentId,
      targetUserId: doctorId || null,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        permissionLevel: result.permissionLevel,
        expiresInMinutes: expiresInMinutes ? Number(expiresInMinutes) : 60,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Doctor access PIN generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/consents
 * Patient retrieves all their issued consent records.
 */
export const listPatientConsentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const consents = await getPatientConsents(req.user.id);

    sendResponse(res, 200, {
      success: true,
      data: {
        consents,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/patient/consents/:consentId
 * Patient revokes an active consent record.
 */
export const revokeConsentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { consentId } = req.params;
    const consent = await revokeConsent(req.user.id, consentId);

    // Record audit log for consent revocation
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.CONSENT_REVOKE,
      resourceType: AuditResourceType.ACCESS_CONSENT,
      resourceId: consentId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        status: consent.status,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Doctor access consent revoked successfully',
      data: {
        consent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/doctor/consents/verify
 * Doctor verifies patient-provided 6-digit PIN to establish authorization.
 */
export const verifyDoctorPinHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { patientId, pin } = req.body || {};
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    if (!patientId) {
      throw new AppError('Missing required patientId parameter in request body.', 400);
    }
    if (!pin) {
      throw new AppError('Missing required 6-digit PIN in request body.', 400);
    }

    const result = await verifyDoctorPin(req.user.id, patientId, String(pin));

    // Record audit log for successful PIN verification
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.CONSENT_VERIFY_SUCCESS,
      resourceType: AuditResourceType.ACCESS_CONSENT,
      resourceId: result.consentId,
      targetUserId: result.patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        permissionLevel: result.permissionLevel,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Patient access authorized',
      data: result,
    });
  } catch (error: any) {
    if (req.user?.id) {
      // Record audit log for failed PIN verification (never logging the attempted PIN)
      await createAuditLog({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        action: AuditAction.CONSENT_VERIFY_FAILURE,
        resourceType: AuditResourceType.ACCESS_CONSENT,
        targetUserId: patientId || null,
        outcome: AuditOutcome.FAILURE,
        metadata: {
          errorMessage: error?.message || 'Verification failed',
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });
    }

    next(error);
  }
};
