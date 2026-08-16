import mongoose, { Document, Schema, Model } from 'mongoose';

export enum VitalSource {
  MANUAL = 'MANUAL',
  DEVICE = 'DEVICE',
  IMPORTED = 'IMPORTED',
}

export interface IVitalSigns {
  patientId: mongoose.Types.ObjectId;
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spo2?: number;
  bloodGlucose?: number;
  temperatureC?: number;
  recordedAt: Date;
  source: VitalSource;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVitalSignsDocument extends IVitalSigns, Document {}

const VitalSignsSchema = new Schema<IVitalSignsDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    heartRate: {
      type: Number,
      min: [0, 'Heart rate must be positive'],
    },
    systolicBP: {
      type: Number,
      min: [0, 'Systolic BP must be positive'],
    },
    diastolicBP: {
      type: Number,
      min: [0, 'Diastolic BP must be positive'],
    },
    spo2: {
      type: Number,
      min: [0, 'SpO2 must be at least 0'],
      max: [100, 'SpO2 cannot exceed 100%'],
    },
    bloodGlucose: {
      type: Number,
      min: [0, 'Blood glucose must be positive'],
    },
    temperatureC: {
      type: Number,
      min: [0, 'Temperature must be positive'],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Recorded timestamp is required'],
    },
    source: {
      type: String,
      enum: Object.values(VitalSource),
      default: VitalSource.MANUAL,
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

// Compound index for querying a patient's vitals by chronology
VitalSignsSchema.index({ patientId: 1, recordedAt: -1 });

export const VitalSigns: Model<IVitalSignsDocument> =
  mongoose.models.VitalSigns ||
  mongoose.model<IVitalSignsDocument>('VitalSigns', VitalSignsSchema);

export default VitalSigns;
