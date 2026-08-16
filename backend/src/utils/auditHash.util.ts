import crypto from 'crypto';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const BANNED_KEYS = new Set([
  'password',
  'passwordhash',
  'pin',
  'pinhash',
  'token',
  'accesstoken',
  'jwt',
  'secret',
  'apikey',
  'filecontent',
  'buffer',
  'datauri',
  'clinicalnotes',
  'rawbody',
]);

/**
 * Recursively sanitizes metadata to strictly guarantee no sensitive credentials,
 * secrets, tokens, or large clinical payloads ever enter audit logs.
 */
export const sanitizeAuditMetadata = (input: unknown): unknown => {
  if (input === null || input === undefined) {
    return {};
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeAuditMetadata(item));
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (BANNED_KEYS.has(normalizedKey)) {
      cleanObj[key] = '[REDACTED_SENSITIVE]';
    } else if (typeof value === 'object' && value !== null) {
      cleanObj[key] = sanitizeAuditMetadata(value);
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj;
};

/**
 * Deterministically sorts object keys for canonical JSON serialization.
 */
const sortObjectKeys = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObjectKeys(obj[key]);
    });
  return sorted;
};

export interface CanonicalAuditPayload {
  sequence: number;
  previousHash: string;
  actorUserId?: string | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  targetUserId?: string | null;
  outcome: string;
  timestamp: string | Date;
  metadata?: Record<string, unknown>;
}

/**
 * Generates canonical SHA-256 integrity hash for an audit record.
 */
export const computeCanonicalAuditHash = (payload: CanonicalAuditPayload): string => {
  const canonicalData = {
    sequence: payload.sequence,
    previousHash: payload.previousHash,
    actorUserId: payload.actorUserId ? String(payload.actorUserId) : null,
    actorRole: payload.actorRole,
    action: payload.action,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId ? String(payload.resourceId) : null,
    targetUserId: payload.targetUserId ? String(payload.targetUserId) : null,
    outcome: payload.outcome,
    timestamp:
      payload.timestamp instanceof Date
        ? payload.timestamp.toISOString()
        : new Date(payload.timestamp).toISOString(),
    metadata: sortObjectKeys(sanitizeAuditMetadata(payload.metadata || {})),
  };

  const serialized = JSON.stringify(canonicalData);
  return crypto.createHash('sha256').update(serialized).digest('hex');
};
