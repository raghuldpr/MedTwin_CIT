import mongoose from 'mongoose';
import {
  User,
  AccountStatus,
  DoctorVerificationStatus,
} from '../models/User';
import { AccessConsent, ConsentStatus } from '../models/AccessConsent';
import { EmergencyAccess, EmergencyAccessStatus } from '../models/EmergencyAccess';
import { MedicalDocument, OcrStatus } from '../models/MedicalDocument';
import { ClinicalNote } from '../models/ClinicalNote';
import { Prescription, PrescriptionStatus } from '../models/Prescription';
import {
  AuditLog,
  AuditAction,
  AuditOutcome,
  IAuditLogDocument,
} from '../models/AuditLog';
import { verifyAuditChain } from './auditLog.service';
import { UserRole } from '../utils/roles';
import { AppError } from '../middleware/error.middleware';

export interface IComplianceSummaryResult {
  users: {
    total: number;
    active: number;
    suspended: number;
    roles: {
      patients: number;
      doctors: number;
      admins: number;
    };
    doctors: {
      total: number;
      verified: number;
      pending: number;
      rejected: number;
    };
  };
  consents: {
    total: number;
    active: number;
    revoked: number;
    expired: number;
  };
  emergencyAccess: {
    totalRequests: number;
    activeSessions: number;
    expiredSessions: number;
    deniedRequests: number;
  };
  securityEvents: {
    totalDeniedAccess: number;
    failedLogins: number;
    breakGlassDenied: number;
    consentFailures: number;
  };
  medicalDocuments: {
    total: number;
    ocrCompleted: number;
    ocrFailed: number;
    ocrPending: number;
  };
  clinicalActivity: {
    totalClinicalNotes: number;
    totalPrescriptions: number;
    activePrescriptions: number;
    cancelledPrescriptions: number;
  };
  auditMetrics: {
    totalLogs: number;
    byOutcome: {
      success: number;
      failure: number;
      denied: number;
    };
    chainIntegrity: {
      valid: boolean;
      checkedRecords: number;
      reason?: string;
    };
  };
}

export interface IAuditReportFilter {
  startDate?: string;
  endDate?: string;
  action?: string;
  actorRole?: string;
  outcome?: string;
  page?: number | string;
  limit?: number | string;
}

export interface IAuditReportResult {
  items: Array<{
    id: string;
    sequence: number;
    actorUserId: string | null;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    targetUserId: string | null;
    outcome: string;
    timestamp: Date;
    ipAddress: string | null;
    integrityHash: string;
    previousHash: string;
    metadata: Record<string, unknown>;
  }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  auditChainIntegrity: {
    valid: boolean;
    checkedRecords: number;
    reason?: string;
  };
}

export interface IExportComplianceOptions {
  format?: 'csv' | 'json' | string;
  startDate?: string;
  endDate?: string;
  action?: string;
  actorRole?: string;
  outcome?: string;
  limit?: number | string;
}

export interface IExportComplianceResult {
  format: 'csv' | 'json';
  contentType: string;
  filename: string;
  data: string | object;
  totalRecords: number;
}

/**
 * Validate ISO date strings and date range.
 */
const validateDateRange = (startDate?: string, endDate?: string): { start?: Date; end?: Date } => {
  let start: Date | undefined;
  let end: Date | undefined;

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (isNaN(parsedStart.getTime())) {
      throw new AppError('Invalid startDate format. Must be a valid date string (e.g. YYYY-MM-DD or ISO 8601).', 400);
    }
    start = parsedStart;
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (isNaN(parsedEnd.getTime())) {
      throw new AppError('Invalid endDate format. Must be a valid date string (e.g. YYYY-MM-DD or ISO 8601).', 400);
    }
    end = parsedEnd;
  }

  if (start && end && start > end) {
    throw new AppError('startDate cannot be after endDate.', 400);
  }

  return { start, end };
};

/**
 * Format and sanitize an audit log document for safe output.
 */
const formatSafeAuditRecord = (record: IAuditLogDocument) => {
  return {
    id: record._id.toString(),
    sequence: record.sequence,
    actorUserId: record.actorUserId ? record.actorUserId.toString() : null,
    actorRole: record.actorRole,
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId ? String(record.resourceId) : null,
    targetUserId: record.targetUserId ? record.targetUserId.toString() : null,
    outcome: record.outcome,
    timestamp: record.timestamp,
    ipAddress: record.ipAddress || null,
    integrityHash: record.integrityHash,
    previousHash: record.previousHash,
    metadata: (record.metadata as Record<string, unknown>) || {},
  };
};

/**
 * 1. GET /api/admin/compliance/summary
 * Aggregate high-level compliance and governance metrics.
 */
export const getComplianceSummary = async (): Promise<IComplianceSummaryResult> => {
  const now = new Date();

  // User metrics
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    patientCount,
    doctorCount,
    adminCount,
    verifiedDoctors,
    pendingDoctors,
    rejectedDoctors,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({
      $or: [{ status: AccountStatus.ACTIVE }, { isActive: true, status: { $exists: false } }],
    }),
    User.countDocuments({
      $or: [{ status: AccountStatus.SUSPENDED }, { isActive: false }],
    }),
    User.countDocuments({ role: UserRole.PATIENT }),
    User.countDocuments({ role: UserRole.DOCTOR }),
    User.countDocuments({ role: UserRole.ADMIN }),
    User.countDocuments({
      role: UserRole.DOCTOR,
      'doctorVerification.verificationStatus': DoctorVerificationStatus.VERIFIED,
    }),
    User.countDocuments({
      role: UserRole.DOCTOR,
      $or: [
        { 'doctorVerification.verificationStatus': DoctorVerificationStatus.PENDING },
        { doctorVerification: { $exists: false } },
      ],
    }),
    User.countDocuments({
      role: UserRole.DOCTOR,
      'doctorVerification.verificationStatus': DoctorVerificationStatus.REJECTED,
    }),
  ]);

  // Consent metrics
  const [totalConsents, activeConsents, revokedConsents, expiredConsents] = await Promise.all([
    AccessConsent.countDocuments({}),
    AccessConsent.countDocuments({ status: ConsentStatus.ACTIVE, expiresAt: { $gt: now } }),
    AccessConsent.countDocuments({ status: ConsentStatus.REVOKED }),
    AccessConsent.countDocuments({
      $or: [{ status: ConsentStatus.EXPIRED }, { status: ConsentStatus.ACTIVE, expiresAt: { $lte: now } }],
    }),
  ]);

  // Emergency access metrics
  const [totalEmergencyRequests, activeEmergencySessions, expiredEmergencySessions, emergencyDeniedLogs] =
    await Promise.all([
      EmergencyAccess.countDocuments({}),
      EmergencyAccess.countDocuments({
        status: EmergencyAccessStatus.ACTIVE,
        expiration: { $gt: now },
      }),
      EmergencyAccess.countDocuments({
        $or: [
          { status: EmergencyAccessStatus.EXPIRED },
          { status: EmergencyAccessStatus.ACTIVE, expiration: { $lte: now } },
        ],
      }),
      AuditLog.countDocuments({ action: AuditAction.EMERGENCY_ACCESS_DENIED }),
    ]);

  // Security & Denied events metrics
  const [totalDeniedLogs, failedLoginLogs, consentFailureLogs] = await Promise.all([
    AuditLog.countDocuments({ outcome: AuditOutcome.DENIED }),
    AuditLog.countDocuments({ action: AuditAction.AUTH_LOGIN_FAILURE }),
    AuditLog.countDocuments({ action: AuditAction.CONSENT_VERIFY_FAILURE }),
  ]);

  // Medical document & OCR metrics
  const [totalDocuments, ocrCompleted, ocrFailed, ocrPending] = await Promise.all([
    MedicalDocument.countDocuments({}),
    MedicalDocument.countDocuments({ ocrStatus: OcrStatus.COMPLETED }),
    MedicalDocument.countDocuments({ ocrStatus: OcrStatus.FAILED }),
    MedicalDocument.countDocuments({
      ocrStatus: { $in: [OcrStatus.PENDING, OcrStatus.PROCESSING] },
    }),
  ]);

  // Clinical & prescription activity metrics
  const [totalClinicalNotes, totalPrescriptions, activePrescriptions, cancelledPrescriptions] =
    await Promise.all([
      ClinicalNote.countDocuments({}),
      Prescription.countDocuments({}),
      Prescription.countDocuments({ status: PrescriptionStatus.ACTIVE }),
      Prescription.countDocuments({ status: PrescriptionStatus.CANCELLED }),
    ]);

  // Audit totals and chain integrity check
  const [totalAuditLogs, successAuditLogs, failureAuditLogs, auditChainIntegrity] =
    await Promise.all([
      AuditLog.countDocuments({}),
      AuditLog.countDocuments({ outcome: AuditOutcome.SUCCESS }),
      AuditLog.countDocuments({ outcome: AuditOutcome.FAILURE }),
      verifyAuditChain(500),
    ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      roles: {
        patients: patientCount,
        doctors: doctorCount,
        admins: adminCount,
      },
      doctors: {
        total: doctorCount,
        verified: verifiedDoctors,
        pending: pendingDoctors,
        rejected: rejectedDoctors,
      },
    },
    consents: {
      total: totalConsents,
      active: activeConsents,
      revoked: revokedConsents,
      expired: expiredConsents,
    },
    emergencyAccess: {
      totalRequests: totalEmergencyRequests,
      activeSessions: activeEmergencySessions,
      expiredSessions: expiredEmergencySessions,
      deniedRequests: emergencyDeniedLogs,
    },
    securityEvents: {
      totalDeniedAccess: totalDeniedLogs,
      failedLogins: failedLoginLogs,
      breakGlassDenied: emergencyDeniedLogs,
      consentFailures: consentFailureLogs,
    },
    medicalDocuments: {
      total: totalDocuments,
      ocrCompleted,
      ocrFailed,
      ocrPending,
    },
    clinicalActivity: {
      totalClinicalNotes,
      totalPrescriptions,
      activePrescriptions,
      cancelledPrescriptions,
    },
    auditMetrics: {
      totalLogs: totalAuditLogs,
      byOutcome: {
        success: successAuditLogs,
        failure: failureAuditLogs,
        denied: totalDeniedLogs,
      },
      chainIntegrity: {
        valid: auditChainIntegrity.valid,
        checkedRecords: auditChainIntegrity.checkedRecords,
        reason: auditChainIntegrity.reason,
      },
    },
  };
};

/**
 * 2. GET /api/admin/compliance/audit-report
 * Filtered, paginated audit records with SHA-256 chain verification.
 */
export const getComplianceAuditReport = async (
  filters: IAuditReportFilter
): Promise<IAuditReportResult> => {
  const { start, end } = validateDateRange(filters.startDate, filters.endDate);

  const query: Record<string, any> = {};

  if (start || end) {
    query.timestamp = {};
    if (start) query.timestamp.$gte = start;
    if (end) query.timestamp.$lte = end;
  }

  if (filters.action && typeof filters.action === 'string' && filters.action.trim()) {
    query.action = filters.action.trim().toUpperCase();
  }

  if (filters.actorRole && typeof filters.actorRole === 'string' && filters.actorRole.trim()) {
    query.actorRole = filters.actorRole.trim().toUpperCase();
  }

  if (filters.outcome && typeof filters.outcome === 'string' && filters.outcome.trim()) {
    query.outcome = filters.outcome.trim().toUpperCase();
  }

  const page = Math.max(1, parseInt(String(filters.page || 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(filters.limit || 25), 10) || 25));
  const skip = (page - 1) * limit;

  const [records, total, chainIntegrity] = await Promise.all([
    AuditLog.find(query).sort({ sequence: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
    verifyAuditChain(500),
  ]);

  const items = records.map(formatSafeAuditRecord);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    page,
    limit,
    total,
    totalPages,
    auditChainIntegrity: {
      valid: chainIntegrity.valid,
      checkedRecords: chainIntegrity.checkedRecords,
      reason: chainIntegrity.reason,
    },
  };
};

/**
 * Escape string value for RFC 4180 compliant CSV output.
 */
const escapeCsvValue = (val: unknown): string => {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * 3. GET /api/admin/compliance/export
 * Safe CSV or JSON export of compliance audit logs.
 */
export const exportComplianceReport = async (
  options: IExportComplianceOptions
): Promise<IExportComplianceResult> => {
  const { start, end } = validateDateRange(options.startDate, options.endDate);

  const query: Record<string, any> = {};

  if (start || end) {
    query.timestamp = {};
    if (start) query.timestamp.$gte = start;
    if (end) query.timestamp.$lte = end;
  }

  if (options.action && typeof options.action === 'string' && options.action.trim()) {
    query.action = options.action.trim().toUpperCase();
  }

  if (options.actorRole && typeof options.actorRole === 'string' && options.actorRole.trim()) {
    query.actorRole = options.actorRole.trim().toUpperCase();
  }

  if (options.outcome && typeof options.outcome === 'string' && options.outcome.trim()) {
    query.outcome = options.outcome.trim().toUpperCase();
  }

  // Cap export size to 1,000 records to prevent CPU/memory exhaustion
  const maxExportLimit = Math.min(1000, Math.max(1, parseInt(String(options.limit || 500), 10) || 500));

  const [records, chainIntegrity] = await Promise.all([
    AuditLog.find(query).sort({ sequence: -1 }).limit(maxExportLimit),
    verifyAuditChain(500),
  ]);

  const safeRecords = records.map(formatSafeAuditRecord);
  const format = (options.format || 'json').toLowerCase() === 'csv' ? 'csv' : 'json';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (format === 'csv') {
    const headers = [
      'sequence',
      'timestamp',
      'action',
      'actorRole',
      'actorUserId',
      'targetUserId',
      'resourceType',
      'resourceId',
      'outcome',
      'ipAddress',
      'integrityHash',
      'previousHash',
      'metadata',
    ];

    const rows = safeRecords.map((r) => [
      r.sequence,
      escapeCsvValue(r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp),
      escapeCsvValue(r.action),
      escapeCsvValue(r.actorRole),
      escapeCsvValue(r.actorUserId),
      escapeCsvValue(r.targetUserId),
      escapeCsvValue(r.resourceType),
      escapeCsvValue(r.resourceId),
      escapeCsvValue(r.outcome),
      escapeCsvValue(r.ipAddress),
      escapeCsvValue(r.integrityHash),
      escapeCsvValue(r.previousHash),
      escapeCsvValue(r.metadata),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return {
      format: 'csv',
      contentType: 'text/csv',
      filename: `medtwin-compliance-audit-export-${timestamp}.csv`,
      data: csvContent,
      totalRecords: safeRecords.length,
    };
  }

  const jsonReport = {
    reportType: 'COMPLIANCE_AUDIT_REPORT',
    generatedAt: new Date().toISOString(),
    totalRecords: safeRecords.length,
    filtersApplied: {
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      action: options.action || null,
      actorRole: options.actorRole || null,
      outcome: options.outcome || null,
      limit: maxExportLimit,
    },
    auditChainIntegrity: {
      valid: chainIntegrity.valid,
      checkedRecords: chainIntegrity.checkedRecords,
      reason: chainIntegrity.reason,
    },
    records: safeRecords,
  };

  return {
    format: 'json',
    contentType: 'application/json',
    filename: `medtwin-compliance-audit-export-${timestamp}.json`,
    data: jsonReport,
    totalRecords: safeRecords.length,
  };
};
