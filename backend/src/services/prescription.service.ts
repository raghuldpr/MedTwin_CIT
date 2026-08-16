import mongoose from 'mongoose';
import {
  Prescription,
  IPrescriptionDocument,
  PrescriptionStatus,
  MedicationItem,
  User,
} from '../models';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../utils/roles';

export interface CreatePrescriptionInput {
  medicationName: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  route?: string;
  duration: string;
  quantity: number;
  instructions?: string;
  startDate?: string | Date;
  endDate?: string | Date | null;
}

/**
 * 1. Create a new prescription for an authorized patient by a doctor.
 * Automatically synchronizes with MedicationItem to reflect in the Patient Digital Twin.
 */
export const createPrescription = async (
  doctorId: string,
  patientId: string,
  data: CreatePrescriptionInput
): Promise<IPrescriptionDocument> => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== UserRole.PATIENT || !patient.isActive) {
    throw new AppError('Patient record not found', 404);
  }

  if (!data.medicationName || !data.medicationName.trim()) {
    throw new AppError('Medication name is required', 400);
  }
  if (data.medicationName.trim().length > 200) {
    throw new AppError('Medication name cannot exceed 200 characters', 400);
  }

  if (!data.dosage || !String(data.dosage).trim()) {
    throw new AppError('Dosage is required (e.g. 500)', 400);
  }

  if (!data.dosageUnit || !data.dosageUnit.trim()) {
    throw new AppError('Dosage unit is required (e.g. mg, ml, tablets)', 400);
  }

  if (!data.frequency || !data.frequency.trim()) {
    throw new AppError('Frequency is required (e.g. Twice daily)', 400);
  }

  if (!data.duration || !data.duration.trim()) {
    throw new AppError('Duration is required (e.g. 7 days, 1 month)', 400);
  }

  const quantityNum = Number(data.quantity);
  if (isNaN(quantityNum) || quantityNum <= 0) {
    throw new AppError('Quantity must be a valid positive number greater than 0', 400);
  }

  let startDate = new Date();
  if (data.startDate) {
    startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      throw new AppError('Invalid startDate format', 400);
    }
  }

  let endDate: Date | null = null;
  if (data.endDate) {
    endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      throw new AppError('Invalid endDate format', 400);
    }
    if (endDate.getTime() < startDate.getTime()) {
      throw new AppError('endDate cannot be earlier than startDate', 400);
    }
  }

  const routeStr = data.route ? data.route.trim().toUpperCase() : 'ORAL';
  const instructionsStr = data.instructions ? data.instructions.trim() : '';

  if (instructionsStr.length > 2000) {
    throw new AppError('Instructions cannot exceed 2000 characters', 400);
  }

  // Create the Prescription record
  const prescription = await Prescription.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    medicationName: data.medicationName.trim(),
    dosage: String(data.dosage).trim(),
    dosageUnit: data.dosageUnit.trim(),
    frequency: data.frequency.trim(),
    route: routeStr,
    duration: data.duration.trim(),
    quantity: quantityNum,
    instructions: instructionsStr,
    startDate,
    endDate,
    status: PrescriptionStatus.ACTIVE,
  });

  // Synchronize with the existing MedicationItem collection (Patient Digital Twin)
  const fullDosage = `${String(data.dosage).trim()} ${data.dosageUnit.trim()}`.trim();
  await MedicationItem.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    name: data.medicationName.trim(),
    dosage: fullDosage,
    frequency: data.frequency.trim(),
    route: routeStr,
    startDate,
    endDate,
    prescribedBy: new mongoose.Types.ObjectId(doctorId),
    instructions: instructionsStr,
    active: true,
  });

  await prescription.populate([
    { path: 'doctorId', select: 'id name email' },
  ]);

  return prescription;
};

/**
 * 2. Retrieve all prescriptions for an authorized patient by a doctor.
 */
export const getDoctorPatientPrescriptions = async (
  _doctorId: string,
  patientId: string
): Promise<IPrescriptionDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== UserRole.PATIENT || !patient.isActive) {
    throw new AppError('Patient record not found', 404);
  }

  const prescriptions = await Prescription.find({
    patientId: new mongoose.Types.ObjectId(patientId),
  })
    .sort({ createdAt: -1 })
    .populate([
      { path: 'doctorId', select: 'id name email' },
      { path: 'cancelledBy', select: 'id name email' },
    ]);

  return prescriptions;
};

/**
 * 3. Retrieve own prescriptions for the authenticated patient.
 */
export const getPatientOwnPrescriptions = async (
  patientId: string
): Promise<IPrescriptionDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const prescriptions = await Prescription.find({
    patientId: new mongoose.Types.ObjectId(patientId),
  })
    .sort({ createdAt: -1 })
    .populate([
      { path: 'doctorId', select: 'id name email' },
      { path: 'cancelledBy', select: 'id name email' },
    ]);

  return prescriptions;
};

/**
 * 4. Cancel a prescription by an authorized doctor.
 * Preserves the clinical record in history with CANCELLED status and deactivates the MedicationItem.
 */
export const cancelPrescription = async (
  doctorId: string,
  patientId: string,
  prescriptionId: string,
  cancelReason?: string
): Promise<IPrescriptionDocument> => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    throw new AppError('Invalid prescription ID format', 400);
  }

  const prescription = await Prescription.findOne({
    _id: new mongoose.Types.ObjectId(prescriptionId),
    patientId: new mongoose.Types.ObjectId(patientId),
  });

  if (!prescription) {
    throw new AppError('Prescription not found for the specified patient', 404);
  }

  // Doctor ownership verification
  if (prescription.doctorId.toString() !== doctorId) {
    throw new AppError('You are not authorized to cancel a prescription created by another doctor', 403);
  }

  if (prescription.status === PrescriptionStatus.CANCELLED) {
    throw new AppError('Prescription is already cancelled', 400);
  }

  prescription.status = PrescriptionStatus.CANCELLED;
  prescription.cancelledAt = new Date();
  prescription.cancelledBy = new mongoose.Types.ObjectId(doctorId);
  prescription.cancelReason = cancelReason?.trim() || 'Cancelled by prescribing doctor';

  await prescription.save();

  // Synchronize deactivation with the patient's MedicationItem in Digital Twin
  await MedicationItem.updateMany(
    {
      patientId: new mongoose.Types.ObjectId(patientId),
      name: prescription.medicationName,
      prescribedBy: new mongoose.Types.ObjectId(doctorId),
      active: true,
    },
    {
      $set: {
        active: false,
        endDate: new Date(),
      },
    }
  );

  await prescription.populate([
    { path: 'doctorId', select: 'id name email' },
    { path: 'cancelledBy', select: 'id name email' },
  ]);

  return prescription;
};
