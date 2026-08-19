import mongoose from 'mongoose';
import {
  User,
  PatientTwinProfile,
  VitalSigns,
  MedicationItem,
  AllergyItem,
  MedicalDocument,
  PermissionLevel,
  IAccessConsentDocument,
} from '../models';
import { getPatientOrganStatus } from './patient.service';
import { getSafeFilePath } from '../utils/storage.util';
import fs from 'fs';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../utils/roles';
import { resolvePatientId } from '../utils/resolvePatientId';

/**
 * 1. Retrieve the complete or basic Patient Digital Twin for an authorized doctor.
 */
export const getAuthorizedPatientTwin = async (
  _doctorId: string,
  patientId: string,
  consent: IAccessConsentDocument
) => {
  const resolvedPatientId = (await resolvePatientId(patientId)) || patientId;

  if (!mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const user = await User.findById(resolvedPatientId);
  if (!user || user.role !== UserRole.PATIENT || !user.isActive) {
    throw new AppError('Patient record not found', 404);
  }

  const profile = await PatientTwinProfile.findOne({ userId: resolvedPatientId });

  const patientDemographics = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : null,
    gender: profile?.gender || null,
    bloodGroup: profile?.bloodGroup || null,
    heightCm: profile?.heightCm ?? null,
    weightKg: profile?.weightKg ?? null,
    emergencyContact: profile?.emergencyContact || { name: '', relationship: '', phone: '' },
  };

  const isBasic = consent.permissionLevel === PermissionLevel.BASIC;

  if (isBasic) {
    // For BASIC consent: Return basic demographics, recent vitals, access metadata; omit sensitive clinical modules
    const recentVitals = await VitalSigns.find({ patientId })
      .sort({ recordedAt: -1 })
      .limit(10);

    return {
      patient: patientDemographics,
      vitals: recentVitals,
      medications: [],
      allergies: [],
      organs: [],
      access: {
        permissionLevel: PermissionLevel.BASIC,
        expiresAt: consent.expiresAt,
        lastVerifiedAt: consent.lastVerifiedAt || null,
      },
    };
  }

  // For FULL consent: Retrieve complete Digital Twin
  const [vitals, medications, allergies, organs] = await Promise.all([
    VitalSigns.find({ patientId }).sort({ recordedAt: -1 }).limit(20),
    MedicationItem.find({ patientId }).sort({ createdAt: -1 }),
    AllergyItem.find({ patientId }).sort({ createdAt: -1 }),
    getPatientOrganStatus(patientId),
  ]);

  return {
    patient: patientDemographics,
    vitals,
    medications,
    allergies,
    organs,
    access: {
      permissionLevel: PermissionLevel.FULL,
      expiresAt: consent.expiresAt,
      lastVerifiedAt: consent.lastVerifiedAt || null,
    },
  };
};

/**
 * 2. Retrieve authorized Patient Profile.
 */
export const getAuthorizedPatientProfile = async (
  _doctorId: string,
  patientId: string,
  _permissionLevel: PermissionLevel
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const user = await User.findById(patientId);
  if (!user || user.role !== UserRole.PATIENT || !user.isActive) {
    throw new AppError('Patient record not found', 404);
  }

  const profile = await PatientTwinProfile.findOne({ userId: patientId });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : null,
    gender: profile?.gender || null,
    bloodGroup: profile?.bloodGroup || null,
    heightCm: profile?.heightCm ?? null,
    weightKg: profile?.weightKg ?? null,
    emergencyContact: profile?.emergencyContact || { name: '', relationship: '', phone: '' },
    createdAt: profile?.createdAt || user.createdAt,
    updatedAt: profile?.updatedAt || user.updatedAt,
  };
};

/**
 * 3. Retrieve authorized Patient Vitals with pagination (newest first).
 */
export const getAuthorizedPatientVitals = async (
  _doctorId: string,
  patientId: string,
  _permissionLevel: PermissionLevel,
  options: { page?: number; limit?: number } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const safePage = Math.max(1, Number(options.page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [vitals, total] = await Promise.all([
    VitalSigns.find({ patientId })
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    VitalSigns.countDocuments({ patientId }),
  ]);

  return {
    items: vitals,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
};

/**
 * 4. Retrieve authorized Patient Medications.
 */
export const getAuthorizedPatientMedications = async (
  _doctorId: string,
  patientId: string,
  permissionLevel: PermissionLevel
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  if (permissionLevel === PermissionLevel.BASIC) {
    throw new AppError(
      'Access restricted. BASIC permission does not include detailed medication records.',
      403
    );
  }

  const medications = await MedicationItem.find({ patientId }).sort({ createdAt: -1 });
  return medications;
};

/**
 * 5. Retrieve authorized Patient Allergies.
 */
export const getAuthorizedPatientAllergies = async (
  _doctorId: string,
  patientId: string,
  permissionLevel: PermissionLevel
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  if (permissionLevel === PermissionLevel.BASIC) {
    throw new AppError(
      'Access restricted. BASIC permission does not include allergy records.',
      403
    );
  }

  const allergies = await AllergyItem.find({ patientId }).sort({ createdAt: -1 });
  return allergies;
};

/**
 * 6. Retrieve authorized Patient Organ System Status.
 */
export const getAuthorizedPatientOrgans = async (
  _doctorId: string,
  patientId: string,
  permissionLevel: PermissionLevel
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  if (permissionLevel === PermissionLevel.BASIC) {
    throw new AppError(
      'Access restricted. BASIC permission does not include organ system assessments.',
      403
    );
  }

  const organs = await getPatientOrganStatus(patientId);
  return organs;
};

/**
 * 7. Retrieve authorized Patient Medical Documents (Requires FULL consent).
 */
export const getAuthorizedPatientDocuments = async (
  _doctorId: string,
  patientId: string,
  permissionLevel: PermissionLevel
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  if (permissionLevel === PermissionLevel.BASIC) {
    throw new AppError(
      'Access restricted. BASIC permission does not include medical documents.',
      403
    );
  }

  const documents = await MedicalDocument.find({
    patientId: new mongoose.Types.ObjectId(patientId),
  }).sort({ createdAt: -1 });

  return documents;
};

/**
 * 8. Retrieve a specific authorized Patient Medical Document file (Requires FULL consent).
 */
export const getAuthorizedPatientDocumentFile = async (
  _doctorId: string,
  patientId: string,
  documentId: string,
  permissionLevel: PermissionLevel
) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new AppError('Invalid document ID format', 400);
  }

  if (permissionLevel === PermissionLevel.BASIC) {
    throw new AppError(
      'Access restricted. BASIC permission does not include medical documents.',
      403
    );
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
