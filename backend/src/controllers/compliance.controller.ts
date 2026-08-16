import { Request, Response, NextFunction } from 'express';
import {
  getComplianceSummary,
  getComplianceAuditReport,
  exportComplianceReport,
} from '../services/compliance.service';
import { createAuditLog } from '../services/auditLog.service';
import {
  AuditAction,
  AuditResourceType,
  AuditOutcome,
} from '../models/AuditLog';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * GET /api/admin/compliance/summary
 * Aggregate compliance, governance, and security metrics.
 */
export const getComplianceSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const summary = await getComplianceSummary();

    await createAuditLog({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || 'ADMIN',
      action: AuditAction.COMPLIANCE_REPORT_VIEW,
      resourceType: AuditResourceType.COMPLIANCE,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        reportType: 'COMPLIANCE_SUMMARY',
        totalUsers: summary.users.total,
        totalConsents: summary.consents.total,
        totalEmergencyRequests: summary.emergencyAccess.totalRequests,
        chainValid: summary.auditMetrics.chainIntegrity.valid,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Compliance summary metrics retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/compliance/audit-report
 * Paginated and filtered compliance audit records with cryptographic SHA-256 chain verification.
 */
export const getComplianceAuditReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, action, actorRole, outcome, page, limit } = req.query;

    const report = await getComplianceAuditReport({
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
      action: typeof action === 'string' ? action : undefined,
      actorRole: typeof actorRole === 'string' ? actorRole : undefined,
      outcome: typeof outcome === 'string' ? outcome : undefined,
      page: typeof page === 'string' ? page : undefined,
      limit: typeof limit === 'string' ? limit : undefined,
    });

    await createAuditLog({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || 'ADMIN',
      action: AuditAction.COMPLIANCE_REPORT_VIEW,
      resourceType: AuditResourceType.COMPLIANCE,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        reportType: 'AUDIT_REPORT',
        filtersApplied: {
          hasDateRange: !!(startDate || endDate),
          actionFilter: action || null,
          roleFilter: actorRole || null,
          outcomeFilter: outcome || null,
        },
        page: report.page,
        limit: report.limit,
        totalRecords: report.total,
        chainValid: report.auditChainIntegrity.valid,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Compliance audit report generated successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/compliance/export
 * Safe CSV or JSON export of compliance audit logs.
 */
export const exportComplianceReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { format, startDate, endDate, action, actorRole, outcome, limit } = req.query;

    const exportResult = await exportComplianceReport({
      format: typeof format === 'string' ? format : 'json',
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
      action: typeof action === 'string' ? action : undefined,
      actorRole: typeof actorRole === 'string' ? actorRole : undefined,
      outcome: typeof outcome === 'string' ? outcome : undefined,
      limit: typeof limit === 'string' ? limit : undefined,
    });

    await createAuditLog({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || 'ADMIN',
      action: AuditAction.COMPLIANCE_REPORT_EXPORT,
      resourceType: AuditResourceType.COMPLIANCE,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        exportFormat: exportResult.format,
        totalRecordsExported: exportResult.totalRecords,
        filename: exportResult.filename,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      userAgent: req.headers['user-agent'] || null,
    });

    if (exportResult.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.status(200).send(exportResult.data);
      return;
    }

    sendResponse(res, 200, {
      success: true,
      message: 'Compliance report exported successfully',
      data: exportResult.data,
    });
  } catch (error) {
    next(error);
  }
};
