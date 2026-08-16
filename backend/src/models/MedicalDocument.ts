import mongoose, { Document, Schema } from 'mongoose';

export enum DocumentCategory {
  LAB_REPORT = 'LAB_REPORT',
  PRESCRIPTION = 'PRESCRIPTION',
  SCAN_REPORT = 'SCAN_REPORT',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',
  OTHER = 'OTHER',
}

export enum OcrStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export interface IOcrExtractedData {
  patientName?: string | null;
  patientIdentifier?: string | null;
  documentType?: string | null;
  doctorOrHospital?: string | null;
  documentDate?: string | null;
  diagnoses?: string[];
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
  }>;
  allergies?: Array<{
    allergen: string;
    reaction?: string;
    severity?: string;
  }>;
  vitalOrLabResults?: Array<{
    testName: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    flag?: string;
  }>;
  clinicalFindings?: string[];
  recommendations?: string[];
  extractionStatus: 'SUCCESS' | 'INSUFFICIENT_DATA' | 'PARTIAL';
  rawSummary?: string;
  disclaimer: string;
}

export interface IMedicalDocument {
  patientId: mongoose.Types.ObjectId;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  documentType: DocumentCategory;
  description?: string;
  ocrStatus: OcrStatus;
  extractedText?: string;
  extractedData?: IOcrExtractedData | null;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicalDocumentDocument extends IMedicalDocument, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
}

const medicalDocumentSchema = new Schema<IMedicalDocumentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    storedFileName: {
      type: String,
      required: [true, 'Stored file identifier is required'],
      select: false, // Prevent exposing internal filesystem identifier by default
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size must be positive'],
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentCategory),
      default: DocumentCategory.OTHER,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    ocrStatus: {
      type: String,
      enum: Object.values(OcrStatus),
      default: OcrStatus.PENDING,
    },
    extractedText: {
      type: String,
      default: '',
    },
    extractedData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId)?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.storedFileName;
        return ret;
      },
    },
  }
);

// Composite index for fast listing of patient documents ordered by newest first
medicalDocumentSchema.index({ patientId: 1, createdAt: -1 });

export const MedicalDocument = mongoose.model<IMedicalDocumentDocument>(
  'MedicalDocument',
  medicalDocumentSchema
);

export default MedicalDocument;
