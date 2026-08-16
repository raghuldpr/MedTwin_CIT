import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PermissionLevel, IAccessConsentDocument } from '../models';
import { getActiveDoctorConsent } from '../services/consent.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { AppError } from './error.middleware';
import { UserRole } from '../utils/roles';

// Augment Express Request interface for consent context
declare global {
  namespace Express {
    interface Request {
      consent?: IAccessConsentDocument;
    }
  }
}

/**
 * Middleware requiring active Patient Consent for a Doctor to access patient records.
 *
 * @param minPermission Optional minimum permission level (e.g. PermissionLevel.FULL)
 */
export const requirePatientConsent = (minPermission?: PermissionLevel) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== UserRole.DOCTOR) {
        return next(
          new AppError('Forbidden. Only authenticated clinical doctors can request patient records.', 403)
        );
      }

      const patientId =
        req.params.patientId || (req.query.patientId as string) || req.body?.patientId;

      if (!patientId) {
        return next(new AppError('Missing required patient ID parameter.', 400));
      }

      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return next(new AppError('Invalid patient ID format.', 400));
      }

      const activeConsent = await getActiveDoctorConsent(req.user.id, patientId, minPermission);

      if (!activeConsent) {
        // Record audit log for denied doctor access attempt
        const url = req.originalUrl || req.path || '';
        let auditAction = AuditAction.TWIN_ACCESS_DENIED;
        let resourceType = AuditResourceType.PATIENT_TWIN;

        if (url.includes('/ocr')) {
          auditAction = AuditAction.DOCUMENT_OCR_ACCESS_DENIED;
          resourceType = AuditResourceType.MEDICAL_DOCUMENT;
        } else if (url.includes('/documents')) {
          auditAction = AuditAction.DOCUMENT_DOCTOR_ACCESS_DENIED;
          resourceType = AuditResourceType.MEDICAL_DOCUMENT;
        } else if (url.includes('/notes')) {
          auditAction = AuditAction.CLINICAL_NOTE_ACCESS_DENIED;
          resourceType = AuditResourceType.CLINICAL_NOTE;
        } else if (url.includes('/prescriptions')) {
          auditAction = AuditAction.PRESCRIPTION_ACCESS_DENIED;
          resourceType = AuditResourceType.PRESCRIPTION;
        } else if (url.includes('/drug-safety-check')) {
          auditAction = AuditAction.DRUG_SAFETY_ACCESS_DENIED;
          resourceType = AuditResourceType.DRUG_SAFETY;
        }

        await createAuditLog({
          actorUserId: req.user.id,
          actorRole: req.user.role,
          action: auditAction,
          resourceType,
          targetUserId: patientId,
          outcome: AuditOutcome.DENIED,
          metadata: {
            requestedPath: req.originalUrl || req.path,
            requiredPermission: minPermission || 'BASIC',
          },
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
          userAgent: req.headers['user-agent'] || null,
        });

        return next(
          new AppError(
            'Patient access unauthorized. Active patient consent is required to access this digital twin.',
            403
          )
        );
      }

      req.consent = activeConsent;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requirePatientConsent;
