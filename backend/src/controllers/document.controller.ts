import { Request, Response, NextFunction } from 'express';
import {
  createDocument,
  getPatientDocuments,
  getPatientDocumentById,
  deletePatientDocument,
} from '../services/document.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/patient/documents
 * Upload a medical document for the authenticated patient.
 */
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    if (!req.file) {
      throw new AppError('No file uploaded. Please attach a medical document (PDF, JPEG, PNG).', 400);
    }

    const { documentType, description } = req.body || {};
    const document = await createDocument(req.user.id, req.file, {
      documentType,
      description,
    });

    // Record audit log for document upload (metadata only, no file content)
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.DOCUMENT_UPLOAD,
      resourceType: AuditResourceType.MEDICAL_DOCUMENT,
      resourceId: document.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        documentType: document.documentType,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Medical document uploaded successfully',
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/documents
 * Retrieve all medical documents belonging to the authenticated patient.
 */
export const listDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const documents = await getPatientDocuments(req.user.id);

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
 * GET /api/patient/documents/:documentId
 * Download or stream the authenticated patient's own document file.
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

    const { documentId } = req.params;
    const { filePath, originalFileName, mimeType } = await getPatientDocumentById(
      req.user.id,
      documentId
    );

    const safeFileName = encodeURIComponent(originalFileName.replace(/["\\]/g, ''));
    const isDownload = req.query.download === 'true';
    const dispositionType = isDownload ? 'attachment' : 'inline';

    // Record audit log for document access
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.DOCUMENT_READ,
      resourceType: AuditResourceType.MEDICAL_DOCUMENT,
      resourceId: documentId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        accessMode: dispositionType,
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

/**
 * GET /api/patient/documents/:documentId/metadata
 * Retrieve metadata for a specific patient medical document.
 */
export const getDocumentMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { documentId } = req.params;
    const { document } = await getPatientDocumentById(req.user.id, documentId);

    sendResponse(res, 200, {
      success: true,
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/patient/documents/:documentId
 * Delete a medical document belonging to the authenticated patient.
 */
export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { documentId } = req.params;
    const result = await deletePatientDocument(req.user.id, documentId);

    // Record audit log for document deletion
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.DOCUMENT_DELETE,
      resourceType: AuditResourceType.MEDICAL_DOCUMENT,
      resourceId: documentId,
      outcome: AuditOutcome.SUCCESS,
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
