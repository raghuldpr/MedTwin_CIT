import { Request, Response, NextFunction } from 'express';
import { queryAuditLogs, verifyAuditChain } from '../services/auditLog.service';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * GET /api/admin/audit-logs
 * Administrative retrieval and filtering of immutable audit logs.
 */
export const getAuditLogsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const {
      actorUserId,
      targetUserId,
      action,
      resourceType,
      outcome,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const result = await queryAuditLogs({
      actorUserId: actorUserId ? String(actorUserId) : undefined,
      targetUserId: targetUserId ? String(targetUserId) : undefined,
      action: action ? String(action) : undefined,
      resourceType: resourceType ? String(resourceType) : undefined,
      outcome: outcome ? String(outcome) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
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
 * GET /api/admin/audit-logs/integrity
 * Cryptographic audit hash chain verification endpoint for compliance audits.
 */
export const verifyAuditIntegrityHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    const maxRecords = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await verifyAuditChain(maxRecords);

    sendResponse(res, 200, {
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
