import mongoose from 'mongoose';
import {
  PatientTwinProfile,
  IPatientTwinProfileDocument,
  VitalSigns,
  IVitalSignsDocument,
  VitalSource,
  MedicationItem,
  IMedicationItemDocument,
  AllergyItem,
  IAllergyItemDocument,
  AllergySeverity,
  OrganSystemStatus,
  IOrganSystemStatusDocument,
  OrganSystemName,
  OrganHealthStatus,
} from '../models';
import { AppError } from '../middleware/error.middleware';

/**
 * Valid blood groups accepted by the system
 */
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];

/**
 * 1. Retrieve or find Patient Digital Twin Profile by authenticated user ID.
 */
export const getPatientProfile = async (
  userId: string
): Promise<IPatientTwinProfileDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  const profile = await PatientTwinProfile.findOne({ userId });
  return profile;
};

/**
 * 2. Create or update Patient Digital Twin Profile.
 * Strictly prevents modifications to userId or security-sensitive fields.
 */
export const upsertPatientProfile = async (
  userId: string,
  data: {
    dateOfBirth?: string | Date;
    gender?: string;
    bloodGroup?: string;
    heightCm?: number;
    weightKg?: number;
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  }
): Promise<IPatientTwinProfileDocument> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  const updatePayload: Record<string, any> = {};

  if (data.dateOfBirth !== undefined) {
    const parsedDate = new Date(data.dateOfBirth);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError('Invalid date of birth provided', 400);
    }
    updatePayload.dateOfBirth = parsedDate;
  }

  if (data.gender !== undefined) {
    updatePayload.gender = String(data.gender).trim();
  }

  if (data.bloodGroup !== undefined) {
    const bg = String(data.bloodGroup).trim().toUpperCase();
    if (bg && !VALID_BLOOD_GROUPS.includes(bg)) {
      throw new AppError(
        `Invalid blood group. Allowed values: ${VALID_BLOOD_GROUPS.join(', ')}`,
        400
      );
    }
    updatePayload.bloodGroup = bg;
  }

  if (data.heightCm !== undefined) {
    const height = Number(data.heightCm);
    if (isNaN(height) || height < 0 || height > 350) {
      throw new AppError('Height must be a valid positive number in cm (0-350)', 400);
    }
    updatePayload.heightCm = height;
  }

  if (data.weightKg !== undefined) {
    const weight = Number(data.weightKg);
    if (isNaN(weight) || weight < 0 || weight > 700) {
      throw new AppError('Weight must be a valid positive number in kg (0-700)', 400);
    }
    updatePayload.weightKg = weight;
  }

  if (data.emergencyContact !== undefined && typeof data.emergencyContact === 'object') {
    updatePayload.emergencyContact = {
      name: data.emergencyContact.name ? String(data.emergencyContact.name).trim() : '',
      relationship: data.emergencyContact.relationship
        ? String(data.emergencyContact.relationship).trim()
        : '',
      phone: data.emergencyContact.phone ? String(data.emergencyContact.phone).trim() : '',
    };
  }

  const profile = await PatientTwinProfile.findOneAndUpdate(
    { userId },
    { $set: updatePayload },
    { new: true, upsert: true, runValidators: true }
  );

  return profile;
};

/**
 * 3. Retrieve paginated recent vital signs for the patient (newest first).
 */
export const getPatientVitals = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<{
  vitals: IVitalSignsDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [vitals, total] = await Promise.all([
    VitalSigns.find({ patientId: userId })
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    VitalSigns.countDocuments({ patientId: userId }),
  ]);

  return {
    vitals,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

/**
 * 4. Add a new vital signs entry for the authenticated patient.
 */
export const addPatientVital = async (
  userId: string,
  data: {
    heartRate?: number;
    systolicBP?: number;
    diastolicBP?: number;
    spo2?: number;
    bloodGlucose?: number;
    temperatureC?: number;
    recordedAt?: string | Date;
    source?: VitalSource | string;
  }
): Promise<IVitalSignsDocument> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  let recordedAtDate = new Date();
  if (data.recordedAt) {
    recordedAtDate = new Date(data.recordedAt);
    if (isNaN(recordedAtDate.getTime())) {
      throw new AppError('Invalid recordedAt timestamp format', 400);
    }
  }

  let sourceVal = VitalSource.MANUAL;
  if (data.source) {
    const upperSource = String(data.source).toUpperCase();
    if (!Object.values(VitalSource).includes(upperSource as VitalSource)) {
      throw new AppError(`Invalid source. Allowed values: ${Object.values(VitalSource).join(', ')}`, 400);
    }
    sourceVal = upperSource as VitalSource;
  }

  // Validate numeric fields if provided
  if (data.heartRate !== undefined && (isNaN(Number(data.heartRate)) || Number(data.heartRate) < 0)) {
    throw new AppError('Heart rate must be a positive number', 400);
  }
  if (data.systolicBP !== undefined && (isNaN(Number(data.systolicBP)) || Number(data.systolicBP) < 0)) {
    throw new AppError('Systolic BP must be a positive number', 400);
  }
  if (data.diastolicBP !== undefined && (isNaN(Number(data.diastolicBP)) || Number(data.diastolicBP) < 0)) {
    throw new AppError('Diastolic BP must be a positive number', 400);
  }
  if (data.spo2 !== undefined && (isNaN(Number(data.spo2)) || Number(data.spo2) < 0 || Number(data.spo2) > 100)) {
    throw new AppError('SpO2 must be between 0 and 100', 400);
  }
  if (data.bloodGlucose !== undefined && (isNaN(Number(data.bloodGlucose)) || Number(data.bloodGlucose) < 0)) {
    throw new AppError('Blood glucose must be a positive number', 400);
  }
  if (data.temperatureC !== undefined && (isNaN(Number(data.temperatureC)) || Number(data.temperatureC) < 0)) {
    throw new AppError('Temperature must be a positive number in Celsius', 400);
  }

  const newVital = await VitalSigns.create({
    patientId: userId,
    heartRate: data.heartRate !== undefined ? Number(data.heartRate) : undefined,
    systolicBP: data.systolicBP !== undefined ? Number(data.systolicBP) : undefined,
    diastolicBP: data.diastolicBP !== undefined ? Number(data.diastolicBP) : undefined,
    spo2: data.spo2 !== undefined ? Number(data.spo2) : undefined,
    bloodGlucose: data.bloodGlucose !== undefined ? Number(data.bloodGlucose) : undefined,
    temperatureC: data.temperatureC !== undefined ? Number(data.temperatureC) : undefined,
    recordedAt: recordedAtDate,
    source: sourceVal,
  });

  return newVital;
};

/**
 * 5. Retrieve all medication items for the authenticated patient.
 */
export const getPatientMedications = async (
  userId: string
): Promise<IMedicationItemDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  const medications = await MedicationItem.find({ patientId: userId }).sort({ createdAt: -1 });
  return medications;
};

/**
 * 6. Add medication item for the authenticated patient.
 */
export const addPatientMedication = async (
  userId: string,
  data: {
    name: string;
    dosage: string;
    frequency: string;
    route?: string;
    startDate?: string | Date;
    endDate?: string | Date | null;
    instructions?: string;
    active?: boolean;
  }
): Promise<IMedicationItemDocument> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  if (!data.name || !data.name.trim()) {
    throw new AppError('Medication name is required', 400);
  }
  if (!data.dosage || !data.dosage.trim()) {
    throw new AppError('Medication dosage is required (e.g. 500mg)', 400);
  }
  if (!data.frequency || !data.frequency.trim()) {
    throw new AppError('Medication frequency is required (e.g. Once daily)', 400);
  }

  let start = new Date();
  if (data.startDate) {
    start = new Date(data.startDate);
    if (isNaN(start.getTime())) {
      throw new AppError('Invalid startDate format', 400);
    }
  }

  let end: Date | null = null;
  if (data.endDate) {
    end = new Date(data.endDate);
    if (isNaN(end.getTime())) {
      throw new AppError('Invalid endDate format', 400);
    }
  }

  const medication = await MedicationItem.create({
    patientId: userId,
    name: data.name.trim(),
    dosage: data.dosage.trim(),
    frequency: data.frequency.trim(),
    route: data.route ? data.route.trim() : 'ORAL',
    startDate: start,
    endDate: end,
    instructions: data.instructions ? data.instructions.trim() : '',
    active: data.active !== undefined ? Boolean(data.active) : true,
    prescribedBy: null, // Initial patient entry
  });

  return medication;
};

/**
 * 7. Retrieve all allergies for the authenticated patient.
 */
export const getPatientAllergies = async (
  userId: string
): Promise<IAllergyItemDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  const allergies = await AllergyItem.find({ patientId: userId }).sort({ createdAt: -1 });
  return allergies;
};

/**
 * 8. Add allergy item for the authenticated patient.
 */
export const addPatientAllergy = async (
  userId: string,
  data: {
    allergen: string;
    reaction?: string;
    severity?: AllergySeverity | string;
    notes?: string;
  }
): Promise<IAllergyItemDocument> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  if (!data.allergen || !data.allergen.trim()) {
    throw new AppError('Allergen name is required (e.g. Penicillin)', 400);
  }

  let severityVal = AllergySeverity.MODERATE;
  if (data.severity) {
    const upperSev = String(data.severity).toUpperCase();
    if (!Object.values(AllergySeverity).includes(upperSev as AllergySeverity)) {
      throw new AppError(
        `Invalid severity. Allowed values: ${Object.values(AllergySeverity).join(', ')}`,
        400
      );
    }
    severityVal = upperSev as AllergySeverity;
  }

  const allergy = await AllergyItem.create({
    patientId: userId,
    allergen: data.allergen.trim(),
    reaction: data.reaction ? data.reaction.trim() : '',
    severity: severityVal,
    notes: data.notes ? data.notes.trim() : '',
  });

  return allergy;
};

/**
 * 9. Retrieve all organ system statuses for the patient.
 * If no records exist, returns initialized baseline set.
 */
export const getPatientOrganStatus = async (
  userId: string
): Promise<IOrganSystemStatusDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  let statuses = await OrganSystemStatus.find({ patientId: userId }).sort({ system: 1 });

  // If no statuses exist yet, populate default normal baseline for all organ systems
  if (statuses.length === 0) {
    const systems = Object.values(OrganSystemName);
    const defaults = systems.map((sys) => ({
      patientId: new mongoose.Types.ObjectId(userId),
      system: sys,
      status: OrganHealthStatus.NORMAL,
      summary: 'Baseline status within normal limits.',
      lastUpdated: new Date(),
    }));

    await OrganSystemStatus.insertMany(defaults);
    statuses = await OrganSystemStatus.find({ patientId: userId }).sort({ system: 1 });
  }

  return statuses;
};
