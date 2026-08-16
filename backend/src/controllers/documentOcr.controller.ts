import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { processDocumentOcr } from '../services/documentOcr.service';
import { createAuditLog } from '../services/auditLog.service';
import {
  AuditAction,
  AuditResourceType,
  AuditOutcome,
} from '../models/AuditLog';
import { MedicalDocument } from '../models/MedicalDocument';
import { AccessConsent, ConsentStatus, PermissionLevel } from '../models/AccessConsent';
import { UserRole } from '../utils/roles';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/patient/documents/:documentId/ocr
 * Trigger AI OCR extraction on a medical document.
 * - Patient: can process own document.
 * - Doctor: requires active FULL consent for document's owner.
 * - Admin: forbidden from clinical OCR endpoint.
 */
export const processDocumentOcrHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return next(new AppError('Invalid document identifier format', 400));
    }

    // Role check: Only PATIENT or DOCTOR allowed
    if (req.user.role === UserRole.ADMIN) {
      return next(new AppError('Admin accounts cannot access clinical OCR processing.', 403));
    }

    if (req.user.role !== UserRole.PATIENT && req.user.role !== UserRole.DOCTOR) {
      return next(new AppError('You do not have permission to access this resource.', 403));
    }

    // Find the medical document to determine ownership
    const document = await MedicalDocument.findById(documentId);
    if (!document) {
      return next(new AppError('Medical document not found', 404));
    }

    const targetPatientId = document.patientId.toString();

    // Verify Patient authorization
    if (req.user.role === UserRole.PATIENT) {
      if (targetPatientId !== req.user.id) {
        await createAuditLog({
          actorUserId: req.user.id,
          actorRole: req.user.role,
          action: AuditAction.DOCUMENT_OCR_ACCESS_DENIED,
          resourceType: AuditResourceType.MEDICAL_DOCUMENT,
          resourceId: documentId,
          targetUserId: targetPatientId,
          outcome: AuditOutcome.DENIED,
          metadata: {
            reason: 'Patient attempted to OCR another patient document',
          },
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
          userAgent: req.headers['user-agent'] || null,
        });

        return next(new AppError('Access denied. You can only process your own medical documents.', 403));
      }
    }

    // Verify Doctor authorization (Requires FULL active consent)
    if (req.user.role === UserRole.DOCTOR) {
      const activeConsent = await AccessConsent.findOne({
        patientId: new mongoose.Types.ObjectId(targetPatientId),
        doctorId: new mongoose.Types.ObjectId(req.user.id),
        status: ConsentStatus.ACTIVE,
        expiresAt: { $gt: new Date() },
      });

      if (!activeConsent || activeConsent.permissionLevel !== PermissionLevel.FULL) {
        await createAuditLog({
          actorUserId: req.user.id,
          actorRole: req.user.role,
          action: AuditAction.DOCUMENT_OCR_ACCESS_DENIED,
          resourceType: AuditResourceType.MEDICAL_DOCUMENT,
          resourceId: documentId,
          targetUserId: targetPatientId,
          outcome: AuditOutcome.DENIED,
          metadata: {
            reason: !activeConsent
              ? 'No active patient consent'
              : `Insufficient permission level (${activeConsent.permissionLevel})`,
            requiredPermission: PermissionLevel.FULL,
          },
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
          userAgent: req.headers['user-agent'] || null,
        });

        return next(
          new AppError(
            'Doctor access unauthorized. Active FULL patient consent is required to process document OCR.',
            403
          )
        );
      }
    }

    // Record DOCUMENT_OCR_START audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.DOCUMENT_OCR_START,
      resourceType: AuditResourceType.MEDICAL_DOCUMENT,
      resourceId: documentId,
      targetUserId: targetPatientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        documentType: document.documentType,
        mimeType: document.mimeType,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    try {
      const result = await processDocumentOcr(documentId, targetPatientId);

      // Record DOCUMENT_OCR_SUCCESS audit log (safe summary only)
      await createAuditLog({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        action: AuditAction.DOCUMENT_OCR_SUCCESS,
        resourceType: AuditResourceType.MEDICAL_DOCUMENT,
        resourceId: documentId,
        targetUserId: targetPatientId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          extractionStatus: result.extractedData.extractionStatus,
          diagnosesCount: result.extractedData.diagnoses?.length || 0,
          medicationsCount: result.extractedData.medications?.length || 0,
          allergiesCount: result.extractedData.allergies?.length || 0,
          vitalOrLabResultsCount: result.extractedData.vitalOrLabResults?.length || 0,
          clinicalFindingsCount: result.extractedData.clinicalFindings?.length || 0,
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });

      sendResponse(res, 200, {
        success: true,
        message: 'Medical document OCR extraction completed successfully',
        data: result,
      });
    } catch (ocrError: any) {
      // Record DOCUMENT_OCR_FAILURE audit log
      await createAuditLog({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        action: AuditAction.DOCUMENT_OCR_FAILURE,
        resourceType: AuditResourceType.MEDICAL_DOCUMENT,
        resourceId: documentId,
        targetUserId: targetPatientId,
        outcome: AuditOutcome.FAILURE,
        metadata: {
          error: ocrError?.message || 'OCR processing failed',
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });

      throw ocrError;
    }
  } catch (error) {
    next(error);
  }
};
