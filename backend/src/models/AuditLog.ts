import mongoose, { Document, Schema } from 'mongoose';

export enum AuditOutcome {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  DENIED = 'DENIED',
}

export enum AuditResourceType {
  AUTH = 'AUTH',
  USER = 'USER',
  ACCESS_CONSENT = 'ACCESS_CONSENT',
  PATIENT_TWIN = 'PATIENT_TWIN',
  MEDICAL_DOCUMENT = 'MEDICAL_DOCUMENT',
  CLINICAL_NOTE = 'CLINICAL_NOTE',
  PRESCRIPTION = 'PRESCRIPTION',
  DRUG_SAFETY = 'DRUG_SAFETY',
  EMERGENCY_ACCESS = 'EMERGENCY_ACCESS',
  VOICE_COMMAND = 'VOICE_COMMAND',
  COMPLIANCE = 'COMPLIANCE',
  AUDIT_LOG = 'AUDIT_LOG',
  SYSTEM = 'SYSTEM',
}

export enum AuditAction {
  // Authentication
  AUTH_REGISTER = 'AUTH_REGISTER',
  AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE',

  // Admin User & Doctor Governance
  ADMIN_USER_LIST = 'ADMIN_USER_LIST',
  ADMIN_USER_VIEW = 'ADMIN_USER_VIEW',
  ADMIN_ACCOUNT_STATUS_CHANGE = 'ADMIN_ACCOUNT_STATUS_CHANGE',
  ADMIN_DOCTOR_VERIFICATION = 'ADMIN_DOCTOR_VERIFICATION',

  // Compliance & Regulatory Reporting
  COMPLIANCE_REPORT_VIEW = 'COMPLIANCE_REPORT_VIEW',
  COMPLIANCE_REPORT_EXPORT = 'COMPLIANCE_REPORT_EXPORT',

  // Consent
  CONSENT_CREATE = 'CONSENT_CREATE',
  CONSENT_REVOKE = 'CONSENT_REVOKE',
  CONSENT_VERIFY_SUCCESS = 'CONSENT_VERIFY_SUCCESS',
  CONSENT_VERIFY_FAILURE = 'CONSENT_VERIFY_FAILURE',

  // Digital Twin
  TWIN_ACCESS_SUCCESS = 'TWIN_ACCESS_SUCCESS',
  TWIN_ACCESS_DENIED = 'TWIN_ACCESS_DENIED',

  // Medical Documents
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_READ = 'DOCUMENT_READ',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_DOCTOR_ACCESS_SUCCESS = 'DOCUMENT_DOCTOR_ACCESS_SUCCESS',
  DOCUMENT_DOCTOR_ACCESS_DENIED = 'DOCUMENT_DOCTOR_ACCESS_DENIED',
  DOCUMENT_OCR_START = 'DOCUMENT_OCR_START',
  DOCUMENT_OCR_SUCCESS = 'DOCUMENT_OCR_SUCCESS',
  DOCUMENT_OCR_FAILURE = 'DOCUMENT_OCR_FAILURE',
  DOCUMENT_OCR_ACCESS_DENIED = 'DOCUMENT_OCR_ACCESS_DENIED',

  // Clinical Notes
  CLINICAL_NOTE_CREATE = 'CLINICAL_NOTE_CREATE',
  CLINICAL_NOTE_READ = 'CLINICAL_NOTE_READ',
  CLINICAL_NOTE_ACCESS_DENIED = 'CLINICAL_NOTE_ACCESS_DENIED',

  // Prescriptions
  PRESCRIPTION_CREATE = 'PRESCRIPTION_CREATE',
  PRESCRIPTION_READ = 'PRESCRIPTION_READ',
  PRESCRIPTION_CANCEL = 'PRESCRIPTION_CANCEL',
  PRESCRIPTION_ACCESS_DENIED = 'PRESCRIPTION_ACCESS_DENIED',

  // Drug Safety & AI Conflict Analysis
  DRUG_SAFETY_CHECK = 'DRUG_SAFETY_CHECK',
  DRUG_SAFETY_ACCESS_DENIED = 'DRUG_SAFETY_ACCESS_DENIED',

  // Emergency Break-Glass Access
  EMERGENCY_ACCESS_GRANTED = 'EMERGENCY_ACCESS_GRANTED',
  EMERGENCY_ACCESS_DENIED = 'EMERGENCY_ACCESS_DENIED',

  // Voice Accessibility Commands
  VOICE_COMMAND_EXECUTED = 'VOICE_COMMAND_EXECUTED',
  VOICE_COMMAND_DENIED = 'VOICE_COMMAND_DENIED',
}

export interface IAuditLog {
  sequence: number;
  actorUserId?: mongoose.Types.ObjectId | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  targetUserId?: mongoose.Types.ObjectId | null;
  outcome: AuditOutcome | string;
  metadata: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: Date;
  previousHash: string;
  integrityHash: string;
  createdAt: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {
  _id: mongoose.Types.ObjectId;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    sequence: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    actorRole: {
      type: String,
      required: true,
      default: 'ANONYMOUS',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      default: null,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    outcome: {
      type: String,
      enum: Object.values(AuditOutcome),
      default: AuditOutcome.SUCCESS,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    previousHash: {
      type: String,
      required: true,
    },
    integrityHash: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only audit trail
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId)?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for administrative querying and filtering
auditLogSchema.index({ timestamp: -1, sequence: -1 });
auditLogSchema.index({ actorUserId: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, outcome: 1 });

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);

export default AuditLog;
