import { Request, Response, NextFunction } from 'express';
import {
  createClinicalNote,
  getDoctorPatientNotes,
  getPatientOwnNotes,
} from '../services/clinicalNote.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/doctor/patients/:patientId/notes
 * Doctor creates a clinical note for an authorized patient.
 */
export const createNoteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { patientId } = req.params;
    const { title, content, noteType, encounterDate } = req.body;

    const note = await createClinicalNote(req.user.id, patientId, {
      title,
      content,
      noteType,
      encounterDate,
    });

    // Record audit log (metadata only, no raw note content)
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.CLINICAL_NOTE_CREATE,
      resourceType: AuditResourceType.CLINICAL_NOTE,
      resourceId: note.id,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        noteType: note.noteType,
        titleLength: note.title.length,
        hasEncounterDate: Boolean(note.encounterDate),
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Clinical note created successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/notes
 * Doctor reads clinical notes for an authorized patient.
 */
export const getDoctorPatientNotesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { patientId } = req.params;
    const notes = await getDoctorPatientNotes(req.user.id, patientId);

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.CLINICAL_NOTE_READ,
      resourceType: AuditResourceType.CLINICAL_NOTE,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        count: notes.length,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        notes,
        total: notes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/notes
 * Patient reads their own clinical notes.
 */
export const getPatientNotesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const notes = await getPatientOwnNotes(req.user.id);

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.CLINICAL_NOTE_READ,
      resourceType: AuditResourceType.CLINICAL_NOTE,
      targetUserId: req.user.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        count: notes.length,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        notes,
        total: notes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
