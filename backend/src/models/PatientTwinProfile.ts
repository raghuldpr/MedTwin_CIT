import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface IPatientTwinProfile {
  userId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  heightCm?: number;
  weightKg?: number;
  emergencyContact?: IEmergencyContact;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPatientTwinProfileDocument extends IPatientTwinProfile, Document {}

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, trim: true, default: '' },
    relationship: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const PatientTwinProfileSchema = new Schema<IPatientTwinProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      trim: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
      uppercase: true,
    },
    heightCm: {
      type: Number,
      min: [0, 'Height must be positive'],
    },
    weightKg: {
      type: Number,
      min: [0, 'Weight must be positive'],
    },
    emergencyContact: {
      type: EmergencyContactSchema,
      default: () => ({ name: '', relationship: '', phone: '' }),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        if (ret.userId && typeof ret.userId === 'object' && ret.userId._id) {
          ret.userId = ret.userId._id.toString();
        } else if (ret.userId) {
          ret.userId = ret.userId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PatientTwinProfile: Model<IPatientTwinProfileDocument> =
  mongoose.models.PatientTwinProfile ||
  mongoose.model<IPatientTwinProfileDocument>('PatientTwinProfile', PatientTwinProfileSchema);

export default PatientTwinProfile;
