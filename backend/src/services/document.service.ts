import fs from 'fs';
import mongoose from 'mongoose';
import {
  MedicalDocument,
  DocumentCategory,
  OcrStatus,
} from '../models/MedicalDocument';
import {
  getSafeFilePath,
  deleteStoredFile,
  verifyFileMagicBytes,
} from '../utils/storage.util';
import { AppError } from '../middleware/error.middleware';

export interface CreateDocumentInput {
  documentType?: string;
  description?: string;
}

/**
 * 1. Upload & register a new patient medical document.
 */
export const createDocument = async (
  patientId: string,
  file: Express.Multer.File,
  data: CreateDocumentInput = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    // Clean up uploaded file if patient ID is invalid
    if (file?.filename) {
      await deleteStoredFile(file.filename);
    }
    throw new AppError('Invalid patient identifier format', 400);
  }

  if (!file) {
    throw new AppError('No file attached. Please provide a medical document.', 400);
  }

  // Validate document category
  let category: DocumentCategory = DocumentCategory.OTHER;
  if (data.documentType) {
    const uppercaseType = data.documentType.toUpperCase();
    if (Object.values(DocumentCategory).includes(uppercaseType as DocumentCategory)) {
      category = uppercaseType as DocumentCategory;
    } else {
      await deleteStoredFile(file.filename);
      throw new AppError(
        `Invalid document category: "${data.documentType}". Allowed: ${Object.values(DocumentCategory).join(', ')}`,
        400
      );
    }
  }

  // Validate physical file signature (magic bytes) to prevent MIME spoofing
  const filePath = getSafeFilePath(file.filename);
  const isValidSignature = await verifyFileMagicBytes(filePath, file.mimetype);
  if (!isValidSignature) {
    await deleteStoredFile(file.filename);
    throw new AppError(
      'Invalid file content. File binary signature does not match the claimed file type.',
      400
    );
  }

  try {
    const document = await MedicalDocument.create({
      patientId: new mongoose.Types.ObjectId(patientId),
      originalFileName: file.originalname || 'document',
      storedFileName: file.filename,
      mimeType: file.mimetype,
      fileSize: file.size,
      documentType: category,
      description: data.description ? data.description.trim() : '',
      ocrStatus: OcrStatus.PENDING,
    });

    return document;
  } catch (error) {
    // Ensure uploaded file is removed if database creation fails
    if (file?.filename) {
      await deleteStoredFile(file.filename);
    }
    throw error;
  }
};

/**
 * 2. Retrieve all documents belonging to the authenticated patient.
 */
export const getPatientDocuments = async (patientId: string) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient identifier format', 400);
  }

  const documents = await MedicalDocument.find({
    patientId: new mongoose.Types.ObjectId(patientId),
  }).sort({ createdAt: -1 });

  return documents;
};

/**
 * 3. Retrieve a specific patient document metadata and safe file path for download.
 */
export const getPatientDocumentById = async (
  patientId: string,
  documentId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient identifier format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new AppError('Invalid document identifier format', 400);
  }

  const document = await MedicalDocument.findOne({
    _id: new mongoose.Types.ObjectId(documentId),
    patientId: new mongoose.Types.ObjectId(patientId),
  }).select('+storedFileName');

  if (!document) {
    throw new AppError('Medical document not found or access denied', 404);
  }

  const filePath = getSafeFilePath(document.storedFileName);
  if (!fs.existsSync(filePath)) {
    throw new AppError('Physical document file not found on storage server', 404);
  }

  return {
    document,
    filePath,
    originalFileName: document.originalFileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
  };
};

/**
 * 4. Delete a patient's document (both physical storage and database metadata).
 */
export const deletePatientDocument = async (
  patientId: string,
  documentId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient identifier format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new AppError('Invalid document identifier format', 400);
  }

  const document = await MedicalDocument.findOne({
    _id: new mongoose.Types.ObjectId(documentId),
    patientId: new mongoose.Types.ObjectId(patientId),
  }).select('+storedFileName');

  if (!document) {
    throw new AppError('Medical document not found or access denied', 404);
  }

  // Delete physical file safely
  await deleteStoredFile(document.storedFileName);

  // Delete from database
  await MedicalDocument.deleteOne({ _id: document._id });

  return {
    success: true,
    message: 'Medical document deleted successfully',
  };
};

/**
 * 5. Retrieve all documents of an authorized patient for a clinical doctor.
 */
export const getAuthorizedDoctorPatientDocuments = async (
  _doctorId: string,
  patientId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient identifier format', 400);
  }

  const documents = await MedicalDocument.find({
    patientId: new mongoose.Types.ObjectId(patientId),
  }).sort({ createdAt: -1 });

  return documents;
};

/**
 * 6. Retrieve a specific patient document file for an authorized clinical doctor.
 */
export const getAuthorizedDoctorPatientDocumentFile = async (
  _doctorId: string,
  patientId: string,
  documentId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient identifier format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new AppError('Invalid document identifier format', 400);
  }

  const document = await MedicalDocument.findOne({
    _id: new mongoose.Types.ObjectId(documentId),
    patientId: new mongoose.Types.ObjectId(patientId),
  }).select('+storedFileName');

  if (!document) {
    throw new AppError('Medical document not found or access denied', 404);
  }

  const filePath = getSafeFilePath(document.storedFileName);
  if (!fs.existsSync(filePath)) {
    throw new AppError('Physical document file not found on storage server', 404);
  }

  return {
    document,
    filePath,
    originalFileName: document.originalFileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
  };
};
