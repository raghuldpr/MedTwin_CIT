import mongoose from 'mongoose';
import {
  AuditLog,
  IAuditLogDocument,
  AuditAction,
  AuditResourceType,
  AuditOutcome,
} from '../models/AuditLog';
import {
  GENESIS_HASH,
  computeCanonicalAuditHash,
  sanitizeAuditMetadata,
} from '../utils/auditHash.util';
import { logger } from '../utils/logger.util';

export interface CreateAuditLogParams {
  actorUserId?: string | mongoose.Types.ObjectId | null;
  actorRole?: string;
  action: AuditAction | string;
  resourceType: AuditResourceType | string;
  resourceId?: string | null;
  targetUserId?: string | mongoose.Types.ObjectId | null;
  outcome?: AuditOutcome | string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogFilterOptions {
  actorUserId?: string;
  targetUserId?: string;
  action?: string;
  resourceType?: string;
  outcome?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditVerificationResult {
  valid: boolean;
  checkedRecords: number;
  firstInvalidRecordId?: string;
  reason?: string;
}

/**
 * 1. Create and append a tamper-evident audit record to the hash chain.
 * Designed with safe concurrency retry handling for sequence collisions.
 */
export const createAuditLog = async (
  params: CreateAuditLogParams
): Promise<IAuditLogDocument | null> => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      // Find the latest audit record to establish chain continuity
      const latestRecord = await AuditLog.findOne().sort({ sequence: -1 });

      const sequence = latestRecord ? latestRecord.sequence + 1 : 1;
      const previousHash = latestRecord ? latestRecord.integrityHash : GENESIS_HASH;
      const timestamp = new Date();

      // Normalize actor and target IDs
      const actorId =
        params.actorUserId && mongoose.Types.ObjectId.isValid(params.actorUserId.toString())
          ? new mongoose.Types.ObjectId(params.actorUserId.toString())
          : null;

      const targetId =
        params.targetUserId && mongoose.Types.ObjectId.isValid(params.targetUserId.toString())
          ? new mongoose.Types.ObjectId(params.targetUserId.toString())
          : null;

      const actorRole = params.actorRole || (actorId ? 'USER' : 'ANONYMOUS');
      const outcome = params.outcome || AuditOutcome.SUCCESS;
      const cleanMetadata = (sanitizeAuditMetadata(params.metadata || {}) as Record<
        string,
        unknown
      >) || {};

      // Compute canonical SHA-256 integrity hash
      const integrityHash = computeCanonicalAuditHash({
        sequence,
        previousHash,
        actorUserId: actorId ? actorId.toString() : null,
        actorRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ? String(params.resourceId) : null,
        targetUserId: targetId ? targetId.toString() : null,
        outcome,
        timestamp,
        metadata: cleanMetadata,
      });

      const auditRecord = await AuditLog.create({
        sequence,
        actorUserId: actorId,
        actorRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ? String(params.resourceId) : null,
        targetUserId: targetId,
        outcome,
        metadata: cleanMetadata,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        timestamp,
        previousHash,
        integrityHash,
      });

      return auditRecord;
    } catch (error: any) {
      // If sequence duplicate key collision occurs during concurrency, retry
      if (error?.code === 11000 && attempt < maxRetries) {
        // Brief exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 20 + 10));
        continue;
      }

      logger.warn(`[AuditLog] Failed to create audit record on attempt ${attempt}:`, error?.message || error);
      if (attempt >= maxRetries) {
        return null;
      }
    }
  }

  return null;
};

/**
 * 2. Verify complete cryptographic integrity of the audit chain.
 * Reads records in chronological sequence, verifying hash continuity and canonical digests.
 */
export const verifyAuditChain = async (
  maxRecords?: number
): Promise<AuditVerificationResult> => {
  let query = AuditLog.find().sort({ sequence: 1 });
  if (maxRecords && maxRecords > 0) {
    query = query.limit(maxRecords);
  }

  const records = await query;

  if (!records || records.length === 0) {
    return {
      valid: true,
      checkedRecords: 0,
    };
  }

  let previousRecordHash = GENESIS_HASH;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Check 1: Sequence number continuity
    const expectedSequence = i + 1;
    if (record.sequence !== expectedSequence) {
      return {
        valid: false,
        checkedRecords: i,
        firstInvalidRecordId: record._id.toString(),
        reason: `Sequence break detected at record ID ${record._id}. Expected sequence ${expectedSequence}, got ${record.sequence}.`,
      };
    }

    // Check 2: Previous hash continuity against prior block
    if (record.previousHash !== previousRecordHash) {
      return {
        valid: false,
        checkedRecords: i,
        firstInvalidRecordId: record._id.toString(),
        reason: `Previous hash mismatch at record ID ${record._id} (sequence ${record.sequence}). Chain continuity broken.`,
      };
    }

    // Check 3: Recalculate canonical integrity hash of record contents
    const expectedIntegrityHash = computeCanonicalAuditHash({
      sequence: record.sequence,
      previousHash: record.previousHash,
      actorUserId: record.actorUserId ? record.actorUserId.toString() : null,
      actorRole: record.actorRole,
      action: record.action,
      resourceType: record.resourceType,
      resourceId: record.resourceId ? String(record.resourceId) : null,
      targetUserId: record.targetUserId ? record.targetUserId.toString() : null,
      outcome: record.outcome,
      timestamp: record.timestamp,
      metadata: record.metadata as Record<string, unknown>,
    });

    if (record.integrityHash !== expectedIntegrityHash) {
      return {
        valid: false,
        checkedRecords: i,
        firstInvalidRecordId: record._id.toString(),
        reason: `Integrity hash mismatch at record ID ${record._id} (sequence ${record.sequence}). Stored record content was tampered or modified.`,
      };
    }

    previousRecordHash = record.integrityHash;
  }

  return {
    valid: true,
    checkedRecords: records.length,
  };
};

/**
 * 3. Query and filter audit logs for administrative compliance reviews.
 */
export const queryAuditLogs = async (options: AuditLogFilterOptions = {}) => {
  const filter: Record<string, any> = {};

  if (options.actorUserId && mongoose.Types.ObjectId.isValid(options.actorUserId)) {
    filter.actorUserId = new mongoose.Types.ObjectId(options.actorUserId);
  }

  if (options.targetUserId && mongoose.Types.ObjectId.isValid(options.targetUserId)) {
    filter.targetUserId = new mongoose.Types.ObjectId(options.targetUserId);
  }

  if (options.action) {
    filter.action = options.action.trim().toUpperCase();
  }

  if (options.resourceType) {
    filter.resourceType = options.resourceType.trim().toUpperCase();
  }

  if (options.outcome) {
    filter.outcome = options.outcome.trim().toUpperCase();
  }

  if (options.startDate || options.endDate) {
    filter.timestamp = {};
    if (options.startDate) {
      filter.timestamp.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      filter.timestamp.$lte = new Date(options.endDate);
    }
  }

  const safePage = Math.max(1, Number(options.page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ sequence: -1, timestamp: -1 })
      .skip(skip)
      .limit(safeLimit),
    AuditLog.countDocuments(filter),
  ]);

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
};
