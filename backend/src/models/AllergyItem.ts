import mongoose, { Document, Schema, Model } from 'mongoose';

export enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  LIFE_THREATENING = 'LIFE_THREATENING',
}

export interface IAllergyItem {
  patientId: mongoose.Types.ObjectId;
  allergen: string;
  reaction?: string;
  severity: AllergySeverity;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAllergyItemDocument extends IAllergyItem, Document {}

const AllergyItemSchema = new Schema<IAllergyItemDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
    },
    allergen: {
      type: String,
      required: [true, 'Allergen name is required (e.g. Penicillin)'],
      trim: true,
    },
    reaction: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: Object.values(AllergySeverity),
      default: AllergySeverity.MODERATE,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

AllergyItemSchema.index({ patientId: 1 });

export const AllergyItem: Model<IAllergyItemDocument> =
  mongoose.models.AllergyItem ||
  mongoose.model<IAllergyItemDocument>('AllergyItem', AllergyItemSchema);

export default AllergyItem;
