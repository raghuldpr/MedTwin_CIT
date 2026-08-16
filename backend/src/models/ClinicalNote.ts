import mongoose, { Document, Schema, Model } from 'mongoose';

export enum ClinicalNoteType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  DIAGNOSIS = 'DIAGNOSIS',
  OBSERVATION = 'OBSERVATION',
  TREATMENT_PLAN = 'TREATMENT_PLAN',
  OTHER = 'OTHER',
}

export interface IClinicalNote {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  noteType: ClinicalNoteType | string;
  title: string;
  content: string;
  encounterDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClinicalNoteDocument extends IClinicalNote, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
}

const ClinicalNoteSchema = new Schema<IClinicalNoteDocument>(
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
    noteType: {
      type: String,
      enum: {
        values: Object.values(ClinicalNoteType),
        message: `Invalid noteType. Allowed values: ${Object.values(ClinicalNoteType).join(', ')}`,
      },
      required: [true, 'Note type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
      minlength: [1, 'Content cannot be empty'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    encounterDate: {
      type: Date,
      default: Date.now,
      index: true,
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

        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ClinicalNoteSchema.index({ patientId: 1, createdAt: -1 });
ClinicalNoteSchema.index({ doctorId: 1, createdAt: -1 });

export const ClinicalNote: Model<IClinicalNoteDocument> =
  mongoose.models.ClinicalNote ||
  mongoose.model<IClinicalNoteDocument>('ClinicalNote', ClinicalNoteSchema);

export default ClinicalNote;
