import { Request, Response, NextFunction } from 'express';
import {
  getAuthorizedPatientTwin,
  getAuthorizedPatientProfile,
  getAuthorizedPatientVitals,
  getAuthorizedPatientMedications,
  getAuthorizedPatientAllergies,
  getAuthorizedPatientOrgans,
  getAuthorizedPatientDocuments,
  getAuthorizedPatientDocumentFile,
} from '../services/doctorPatient.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * GET /api/doctor/patients/:patientId/twin
 * Retrieve the full or basic Digital Twin for an authorized patient.
 */
export const getTwin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId } = req.params;
    const twinData = await getAuthorizedPatientTwin(req.user.id, patientId, req.consent);

    // Record audit log for doctor accessing patient Digital Twin
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.TWIN_ACCESS_SUCCESS,
      resourceType: AuditResourceType.PATIENT_TWIN,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        section: 'twin_full',
        permissionLevel: req.consent.permissionLevel,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: twinData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/profile
 * Retrieve authorized patient demographics and baseline profile.
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId } = req.params;
    const profile = await getAuthorizedPatientProfile(
      req.user.id,
      patientId,
      req.consent.permissionLevel
    );

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.TWIN_ACCESS_SUCCESS,
      resourceType: AuditResourceType.PATIENT_TWIN,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        section: 'profile',
        permissionLevel: req.consent.permissionLevel,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/vitals
 * Retrieve paginated vital signs for the authorized patient.
 */
export const getVitals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId } = req.params;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await getAuthorizedPatientVitals(
      req.user.id,
      patientId,
      req.consent.permissionLevel,
      { page, limit }
    );

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.TWIN_ACCESS_SUCCESS,
      resourceType: AuditResourceType.PATIENT_TWIN,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        section: 'vitals',
        permissionLevel: req.consent.permissionLevel,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/medications
 * Retrieve active and historical medications for the authorized patient.
 */
export const getMedications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId } = req.params;
    const medications = await getAuthorizedPatientMedications(
      req.user.id,
      patientId,
      req.consent.permissionLevel
    );

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.TWIN_ACCESS_SUCCESS,
      resourceType: AuditResourceType.PATIENT_TWIN,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        section: 'medications',
        permissionLevel: req.consent.permissionLevel,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        medications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/allergies
 * Retrieve recorded allergies for the authorized patient.
 */
export const getAllergies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId } = req.params;
    const allergies = await getAuthorizedPatientAllergies(
      req.user.id,
      patientId,
      req.consent.permissionLevel
    );

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.TWIN_ACCESS_SUCCESS,
      resourceType: AuditResourceType.PATIENT_TWIN,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        section: 'allergies',
        permissionLevel: req.consent.permissionLevel,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        allergies,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/organs
 * Retrieve 10 organ systems health status for the authorized patient.
 */
export const getOrgans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId } = req.params;
    const organs = await getAuthorizedPatientOrgans(
      req.user.id,
      patientId,
      req.consent.permissionLevel
    );

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.TWIN_ACCESS_SUCCESS,
      resourceType: AuditResourceType.PATIENT_TWIN,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        section: 'organs',
        permissionLevel: req.consent.permissionLevel,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        organs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/documents
 * Retrieve authorized patient medical documents (Requires FULL consent).
 */
export const getDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId } = req.params;
    const documents = await getAuthorizedPatientDocuments(
      req.user.id,
      patientId,
      req.consent.permissionLevel
    );

    // Record audit log for doctor viewing patient document metadata
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.DOCUMENT_DOCTOR_ACCESS_SUCCESS,
      resourceType: AuditResourceType.MEDICAL_DOCUMENT,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        documentCount: documents.length,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        documents,
        count: documents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/documents/:documentId
 * Stream or download authorized patient medical document file (Requires FULL consent).
 */
export const getDocumentFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }
    if (!req.consent) {
      throw new AppError('Active patient consent is required.', 403);
    }

    const { patientId, documentId } = req.params;
    const { filePath, originalFileName, mimeType } = await getAuthorizedPatientDocumentFile(
      req.user.id,
      patientId,
      documentId,
      req.consent.permissionLevel
    );

    const safeFileName = encodeURIComponent(originalFileName.replace(/["\\]/g, ''));
    const isDownload = req.query.download === 'true';
    const dispositionType = isDownload ? 'attachment' : 'inline';

    // Record audit log for doctor accessing patient document file
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.DOCUMENT_DOCTOR_ACCESS_SUCCESS,
      resourceType: AuditResourceType.MEDICAL_DOCUMENT,
      resourceId: documentId,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        accessMode: dispositionType,
        originalFileName: safeFileName,
        mimeType,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `${dispositionType}; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`
    );

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

