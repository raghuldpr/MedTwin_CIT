import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { grantEmergencyAccess, MIN_JUSTIFICATION_LENGTH } from '../services/emergencyAccess.service';
import { createAuditLog } from '../services/auditLog.service';
import {
  AuditAction,
  AuditResourceType,
  AuditOutcome,
} from '../models/AuditLog';
import { User } from '../models/User';
import { UserRole } from '../utils/roles';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/doctor/patients/:patientId/emergency-access
 * Emergency Break-Glass Access:
 * - Allows authenticated DOCTOR to access patient Digital Twin during emergencies.
 * - Bypasses normal consent for this emergency session only.
 * - Never modifies or creates standard patient consent.
 * - Grants FULL read-only Digital Twin access.
 * - Audits EMERGENCY_ACCESS_GRANTED / EMERGENCY_ACCESS_DENIED.
 */
export const emergencyAccessHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      return next(new AppError('Authentication required.', 401));
    }

    const { patientId } = req.params;
    const { justification } = req.body || {};

    // 1. Role Verification: ONLY DOCTORS allowed
    if (req.user.role !== UserRole.DOCTOR) {
      await createAuditLog({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        action: AuditAction.EMERGENCY_ACCESS_DENIED,
        resourceType: AuditResourceType.EMERGENCY_ACCESS,
        targetUserId: patientId && mongoose.Types.ObjectId.isValid(patientId) ? patientId : null,
        outcome: AuditOutcome.DENIED,
        metadata: {
          reason: `Unauthorized role (${req.user.role}). Only clinical doctors can initiate emergency break-glass access.`,
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });

      return next(
        new AppError(
          'Forbidden. Only authenticated clinical doctors are permitted to invoke emergency break-glass access.',
          403
        )
      );
    }

    // 2. Patient ID Format Verification
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      await createAuditLog({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        action: AuditAction.EMERGENCY_ACCESS_DENIED,
        resourceType: AuditResourceType.EMERGENCY_ACCESS,
        targetUserId: null,
        outcome: AuditOutcome.FAILURE,
        metadata: {
          reason: 'Invalid patient ID format',
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });

      return next(new AppError('Invalid patient identifier format.', 400));
    }

    // 3. Patient Existence Verification
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== UserRole.PATIENT || !patient.isActive) {
      await createAuditLog({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        action: AuditAction.EMERGENCY_ACCESS_DENIED,
        resourceType: AuditResourceType.EMERGENCY_ACCESS,
        targetUserId: patientId,
        outcome: AuditOutcome.FAILURE,
        metadata: {
          reason: 'Target patient record not found or inactive',
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });

      return next(new AppError('Patient record not found.', 404));
    }

    // 4. Justification Validation (mandatory, minimum 10 characters)
    const trimmedJustification = typeof justification === 'string' ? justification.trim() : '';
    if (!trimmedJustification || trimmedJustification.length < MIN_JUSTIFICATION_LENGTH) {
      await createAuditLog({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        action: AuditAction.EMERGENCY_ACCESS_DENIED,
        resourceType: AuditResourceType.EMERGENCY_ACCESS,
        targetUserId: patientId,
        outcome: AuditOutcome.FAILURE,
        metadata: {
          reason: `Emergency justification is mandatory and must be at least ${MIN_JUSTIFICATION_LENGTH} characters long.`,
          justificationLength: trimmedJustification.length,
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });

      return next(
        new AppError(
          `Emergency justification is mandatory and must be at least ${MIN_JUSTIFICATION_LENGTH} characters long.`,
          400
        )
      );
    }

    // 5. Grant Emergency Break-Glass Access
    const result = await grantEmergencyAccess(
      req.user.id,
      patientId,
      trimmedJustification
    );

    // 6. Record EMERGENCY_ACCESS_GRANTED audit event (without leaking clinical content)
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.EMERGENCY_ACCESS_GRANTED,
      resourceType: AuditResourceType.EMERGENCY_ACCESS,
      resourceId: result.emergencyAccess.id,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        emergencyAccessId: result.emergencyAccess.id,
        justificationLength: trimmedJustification.length,
        expiration: result.emergencyAccess.expiration.toISOString(),
        readOnly: true,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Emergency break-glass access granted',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
