import mongoose, { Document, Schema } from 'mongoose';

export enum EmergencyAccessStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface IEmergencyAccess {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  justification: string;
  timestamp: Date;
  expiration: Date;
  status: EmergencyAccessStatus | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEmergencyAccessDocument extends IEmergencyAccess, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  isExpired(): boolean;
}

const emergencyAccessSchema = new Schema<IEmergencyAccessDocument>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID reference is required'],
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    justification: {
      type: String,
      required: [true, 'Emergency justification is mandatory'],
      trim: true,
      minlength: [10, 'Justification must be at least 10 characters long'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiration: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EmergencyAccessStatus),
      default: EmergencyAccessStatus.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

emergencyAccessSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiration || this.status === EmergencyAccessStatus.EXPIRED;
};

export const EmergencyAccess = mongoose.model<IEmergencyAccessDocument>(
  'EmergencyAccess',
  emergencyAccessSchema
);
