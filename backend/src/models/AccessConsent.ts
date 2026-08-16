import mongoose, { Document, Schema, Model } from 'mongoose';

export enum ConsentStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum PermissionLevel {
  BASIC = 'BASIC',
  FULL = 'FULL',
}

export interface IAccessConsent {
  patientId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId | null;
  pinHash: string;
  expiresAt: Date;
  status: ConsentStatus;
  permissionLevel: PermissionLevel;
  failedAttempts: number;
  lockedUntil?: Date | null;
  lastVerifiedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAccessConsentDocument extends IAccessConsent, Document {}

const AccessConsentSchema = new Schema<IAccessConsentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    pinHash: {
      type: String,
      required: [true, 'PIN hash is required'],
      select: false, // Prevents plaintext or hash leakage in general queries
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ConsentStatus),
      default: ConsentStatus.ACTIVE,
      required: true,
      index: true,
    },
    permissionLevel: {
      type: String,
      enum: Object.values(PermissionLevel),
      default: PermissionLevel.FULL,
      required: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        ret.consentId = ret.id;
        if (ret.patientId && typeof ret.patientId === 'object' && ret.patientId._id) {
          ret.patientId = ret.patientId._id.toString();
        } else if (ret.patientId) {
          ret.patientId = ret.patientId.toString();
        }
        if (ret.doctorId && typeof ret.doctorId === 'object' && ret.doctorId._id) {
          ret.doctorId = ret.doctorId._id.toString();
        } else if (ret.doctorId) {
          ret.doctorId = ret.doctorId.toString();
        } else {
          ret.doctorId = null;
        }
        delete ret._id;
        delete ret.__v;
        delete ret.pinHash; // Enforce security: never serialize pinHash
        return ret;
      },
    },
  }
);

// Compound indexes for fast active consent lookups
AccessConsentSchema.index({ patientId: 1, doctorId: 1, status: 1, expiresAt: 1 });
AccessConsentSchema.index({ patientId: 1, status: 1, expiresAt: 1 });

export const AccessConsent: Model<IAccessConsentDocument> =
  mongoose.models.AccessConsent ||
  mongoose.model<IAccessConsentDocument>('AccessConsent', AccessConsentSchema);

export default AccessConsent;
