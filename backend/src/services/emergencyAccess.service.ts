import mongoose from 'mongoose';
import {
  EmergencyAccess,
  EmergencyAccessStatus,
  User,
  PatientTwinProfile,
  VitalSigns,
  MedicationItem,
  AllergyItem,
  MedicalDocument,
} from '../models';
import { getPatientOrganStatus } from './patient.service';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../utils/roles';

export const EMERGENCY_ACCESS_DURATION_MINUTES = 60; // 1 hour default expiration
export const MIN_JUSTIFICATION_LENGTH = 10;

export const EMERGENCY_ACCESS_DISCLAIMER =
  'EMERGENCY BREAK-GLASS READ-ONLY ACCESS. All access is strictly audited and subject to clinical review. Clinical modification, note entry, and prescription creation are strictly prohibited under emergency access.';

/**
 * Grant Emergency Break-Glass Read-Only Access to a Patient's Digital Twin.
 * Bypasses normal consent for this emergency session only.
 * Never creates or alters normal patient consent records.
 */
export const grantEmergencyAccess = async (
  doctorId: string,
  patientId: string,
  justification: string,
  options: { expirationMinutes?: number } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor identifier format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient identifier format', 400);
  }

  const trimmedJustification = (justification || '').trim();
  if (trimmedJustification.length < MIN_JUSTIFICATION_LENGTH) {
    throw new AppError(
      `Emergency justification is mandatory and must be at least ${MIN_JUSTIFICATION_LENGTH} characters long.`,
      400
    );
  }

  // Verify patient exists and is active
  const patientUser = await User.findById(patientId);
  if (!patientUser || patientUser.role !== UserRole.PATIENT || !patientUser.isActive) {
    throw new AppError('Patient record not found or inactive', 404);
  }

  // Verify doctor exists and has DOCTOR role
  const doctorUser = await User.findById(doctorId);
  if (!doctorUser || doctorUser.role !== UserRole.DOCTOR || !doctorUser.isActive) {
    throw new AppError('Doctor record not found or unauthorized', 403);
  }

  const durationMinutes = options.expirationMinutes || EMERGENCY_ACCESS_DURATION_MINUTES;
  const now = new Date();
  const expiration = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // Create and save emergency access record
  const emergencyAccess = await EmergencyAccess.create({
    doctorId: new mongoose.Types.ObjectId(doctorId),
    patientId: new mongoose.Types.ObjectId(patientId),
    justification: trimmedJustification,
    timestamp: now,
    expiration,
    status: EmergencyAccessStatus.ACTIVE,
  });

  // Fetch full read-only digital twin records
  const profile = await PatientTwinProfile.findOne({ userId: patientId });

  const patientDemographics = {
    id: patientUser._id.toString(),
    name: patientUser.name,
    email: patientUser.email,
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : null,
    gender: profile?.gender || null,
    bloodGroup: profile?.bloodGroup || null,
    heightCm: profile?.heightCm ?? null,
    weightKg: profile?.weightKg ?? null,
    emergencyContact: profile?.emergencyContact || { name: '', relationship: '', phone: '' },
  };

  const [vitals, medications, allergies, organs, documents] = await Promise.all([
    VitalSigns.find({ patientId }).sort({ recordedAt: -1 }).limit(50),
    MedicationItem.find({ patientId }).sort({ createdAt: -1 }),
    AllergyItem.find({ patientId }).sort({ createdAt: -1 }),
    getPatientOrganStatus(patientId),
    MedicalDocument.find({ patientId: new mongoose.Types.ObjectId(patientId) }).sort({ createdAt: -1 }),
  ]);

  const responseData = {
    emergencyAccess: {
      id: emergencyAccess._id.toString(),
      doctorId: emergencyAccess.doctorId.toString(),
      patientId: emergencyAccess.patientId.toString(),
      justification: emergencyAccess.justification,
      timestamp: emergencyAccess.timestamp,
      expiration: emergencyAccess.expiration,
      status: emergencyAccess.status,
    },
    digitalTwin: {
      patient: patientDemographics,
      vitals,
      medications,
      allergies,
      organs,
      documents,
    },
    readOnly: true,
    disclaimer: EMERGENCY_ACCESS_DISCLAIMER,
  };

  return responseData;
};

/**
 * Check if a doctor has an active, unexpired emergency access record for a patient.
 */
export const getActiveEmergencyAccess = async (doctorId: string, patientId: string) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(patientId)) {
    return null;
  }

  const record = await EmergencyAccess.findOne({
    doctorId: new mongoose.Types.ObjectId(doctorId),
    patientId: new mongoose.Types.ObjectId(patientId),
    status: EmergencyAccessStatus.ACTIVE,
    expiration: { $gt: new Date() },
  });

  return record;
};
