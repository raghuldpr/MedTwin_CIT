import mongoose, { Document, Schema, Model } from 'mongoose';

export enum OrganSystemName {
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  RESPIRATORY = 'RESPIRATORY',
  NERVOUS = 'NERVOUS',
  DIGESTIVE = 'DIGESTIVE',
  RENAL = 'RENAL',
  HEPATIC = 'HEPATIC',
  MUSCULOSKELETAL = 'MUSCULOSKELETAL',
  ENDOCRINE = 'ENDOCRINE',
  IMMUNE = 'IMMUNE',
  REPRODUCTIVE = 'REPRODUCTIVE',
}

export enum OrganHealthStatus {
  NORMAL = 'NORMAL',
  MONITOR = 'MONITOR',
  ABNORMAL = 'ABNORMAL',
  CRITICAL = 'CRITICAL',
}

export interface IOrganSystemStatus {
  patientId: mongoose.Types.ObjectId;
  system: OrganSystemName;
  status: OrganHealthStatus;
  summary?: string;
  lastUpdated: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrganSystemStatusDocument extends IOrganSystemStatus, Document {}

const OrganSystemStatusSchema = new Schema<IOrganSystemStatusDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    system: {
      type: String,
      enum: Object.values(OrganSystemName),
      required: [true, 'Organ system name is required'],
    },
    status: {
      type: String,
      enum: Object.values(OrganHealthStatus),
      default: OrganHealthStatus.NORMAL,
      required: true,
    },
    summary: {
      type: String,
      trim: true,
      default: 'No abnormal findings noted.',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        if (ret.patientId && typeof ret.patientId === 'object' && ret.patientId._id) {
          ret.patientId = ret.patientId._id.toString();
        } else if (ret.patientId) {
          ret.patientId = ret.patientId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index to ensure patient organ system queries are fast
OrganSystemStatusSchema.index({ patientId: 1, system: 1 });

export const OrganSystemStatus: Model<IOrganSystemStatusDocument> =
  mongoose.models.OrganSystemStatus ||
  mongoose.model<IOrganSystemStatusDocument>('OrganSystemStatus', OrganSystemStatusSchema);

export default OrganSystemStatus;
