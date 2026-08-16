import { Request, Response, NextFunction } from 'express';
import { analyzePatientDrugSafety } from '../services/drugSafety.service';
import { createAuditLog } from '../services/auditLog.service';
import { AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/doctor/patients/:patientId/drug-safety-check
 * Doctor requests AI drug safety and medication conflict analysis for an authorized patient.
 */
export const checkDrugSafetyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { patientId } = req.params;
    const { proposedMedication } = req.body || {};

    const analysis = await analyzePatientDrugSafety(
      req.user.id,
      patientId,
      proposedMedication
    );

    // Record audit log (Safe summary metrics only, no raw patient clinical text or AI prompts)
    await createAuditLog({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: AuditAction.DRUG_SAFETY_CHECK,
      resourceType: AuditResourceType.DRUG_SAFETY,
      targetUserId: patientId,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        status: analysis.status,
        overallRiskScore: analysis.overallRiskScore,
        severity: analysis.severity,
        drugInteractionsCount: analysis.drugDrugInteractions.length,
        allergyConflictsCount: analysis.allergyConflicts.length,
        contraindicationsCount: analysis.contraindications.length,
        duplicateTherapiesCount: analysis.duplicateTherapies.length,
        medicationsAnalyzedCount: analysis.patientDataSummary.analyzedMedications.length,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'AI drug safety analysis completed successfully',
      data: {
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
};
