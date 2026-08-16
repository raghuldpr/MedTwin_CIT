import { Request, Response, NextFunction } from 'express';
import {
  createPrescription,
  getDoctorPatientPrescriptions,
  getPatientOwnPrescriptions,
  cancelPrescription,
} from '../services/prescription.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/doctor/patients/:patientId/prescriptions
 * Doctor creates a prescription for an authorized patient.
 */
export const createPrescriptionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { patientId } = req.params;
    const {
      medicationName,
      dosage,
      dosageUnit,
      frequency,
      route,
      duration,
      quantity,
      instructions,
      startDate,
      endDate,
    } = req.body;

    const prescription = await createPrescription(req.user.id, patientId, {
      medicationName,
      dosage,
      dosageUnit,
      frequency,
      route,
      duration,
      quantity,
      instructions,
      startDate,
      endDate,
    });

    // Record audit log (metadata only, no secrets or unnecessary details)
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.PRESCRIPTION_CREATE,
      resourceType: AuditResourceType.PRESCRIPTION,
      resourceId: prescription.id,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        medicationName: prescription.medicationName,
        dosage: `${prescription.dosage} ${prescription.dosageUnit}`,
        frequency: prescription.frequency,
        duration: prescription.duration,
        quantity: prescription.quantity,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Prescription created successfully',
      data: { prescription },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/patients/:patientId/prescriptions
 * Doctor reads prescriptions for an authorized patient.
 */
export const getDoctorPatientPrescriptionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { patientId } = req.params;
    const prescriptions = await getDoctorPatientPrescriptions(req.user.id, patientId);

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.PRESCRIPTION_READ,
      resourceType: AuditResourceType.PRESCRIPTION,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        count: prescriptions.length,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        prescriptions,
        total: prescriptions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/prescriptions
 * Patient reads their own prescriptions.
 */
export const getPatientPrescriptionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const prescriptions = await getPatientOwnPrescriptions(req.user.id);

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.PRESCRIPTION_READ,
      resourceType: AuditResourceType.PRESCRIPTION,
      targetUserId: req.user.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        count: prescriptions.length,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      data: {
        prescriptions,
        total: prescriptions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/doctor/patients/:patientId/prescriptions/:prescriptionId/cancel
 * Doctor cancels an active prescription.
 */
export const cancelPrescriptionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { patientId, prescriptionId } = req.params;
    const { reason } = req.body;

    const prescription = await cancelPrescription(
      req.user.id,
      patientId,
      prescriptionId,
      reason
    );

    // Record audit log
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.PRESCRIPTION_CANCEL,
      resourceType: AuditResourceType.PRESCRIPTION,
      resourceId: prescription.id,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        medicationName: prescription.medicationName,
        cancelReason: prescription.cancelReason,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Prescription cancelled successfully',
      data: { prescription },
    });
  } catch (error) {
    next(error);
  }
};
