import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMedicationItem {
  patientId: mongoose.Types.ObjectId;
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  startDate?: Date;
  endDate?: Date | null;
  prescribedBy?: mongoose.Types.ObjectId | null;
  instructions?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMedicationItemDocument extends IMedicationItem, Document {}

const MedicationItemSchema = new Schema<IMedicationItemDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required (e.g. 500mg)'],
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
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    prescribedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
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
        if (ret.prescribedBy && typeof ret.prescribedBy === 'object' && ret.prescribedBy._id) {
          ret.prescribedBy = ret.prescribedBy._id.toString();
        } else if (ret.prescribedBy) {
          ret.prescribedBy = ret.prescribedBy.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

MedicationItemSchema.index({ patientId: 1, active: 1 });

export const MedicationItem: Model<IMedicationItemDocument> =
  mongoose.models.MedicationItem ||
  mongoose.model<IMedicationItemDocument>('MedicationItem', MedicationItemSchema);

export default MedicationItem;
