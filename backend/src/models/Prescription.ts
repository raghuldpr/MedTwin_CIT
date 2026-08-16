import mongoose, { Document, Schema, Model } from 'mongoose';

export enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IPrescription {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  medicationName: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  route: string;
  duration: string;
  quantity: number;
  instructions: string;
  startDate: Date;
  endDate: Date | null;
  status: PrescriptionStatus | string;
  cancelledAt?: Date | null;
  cancelledBy?: mongoose.Types.ObjectId | null;
  cancelReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPrescriptionDocument extends IPrescription, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
}

const PrescriptionSchema = new Schema<IPrescriptionDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID reference is required'],
      index: true,
    },
    medicationName: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      minlength: [1, 'Medication name cannot be empty'],
      maxlength: [200, 'Medication name cannot exceed 200 characters'],
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required (e.g. 500)'],
      trim: true,
    },
    dosageUnit: {
      type: String,
      required: [true, 'Dosage unit is required (e.g. mg, ml, tablets)'],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required (e.g. Twice daily)'],
      trim: true,
    },
    route: {
      type: String,
      trim: true,
      default: 'ORAL',
    },
    duration: {
      type: String,
      required: [true, 'Duration is required (e.g. 7 days, 1 month)'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PrescriptionStatus),
        message: `Invalid prescription status. Allowed values: ${Object.values(PrescriptionStatus).join(', ')}`,
      },
      default: PrescriptionStatus.ACTIVE,
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        if (ret.patientId && typeof ret.patientId === 'object' && ret.patientId._id) {
          ret.patientId = {
            id: ret.patientId._id.toString(),
            name: ret.patientId.name,
            email: ret.patientId.email,
          };
        } else if (ret.patientId) {
          ret.patientId = ret.patientId.toString();
        }

        if (ret.doctorId && typeof ret.doctorId === 'object' && ret.doctorId._id) {
          ret.doctorId = {
            id: ret.doctorId._id.toString(),
            name: ret.doctorId.name,
            email: ret.doctorId.email,
          };
        } else if (ret.doctorId) {
          ret.doctorId = ret.doctorId.toString();
        }

        if (ret.cancelledBy && typeof ret.cancelledBy === 'object' && ret.cancelledBy._id) {
          ret.cancelledBy = {
            id: ret.cancelledBy._id.toString(),
            name: ret.cancelledBy.name,
            email: ret.cancelledBy.email,
          };
        } else if (ret.cancelledBy) {
          ret.cancelledBy = ret.cancelledBy.toString();
        }

        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

PrescriptionSchema.index({ patientId: 1, status: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });

export const Prescription: Model<IPrescriptionDocument> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescriptionDocument>('Prescription', PrescriptionSchema);

export default Prescription;
