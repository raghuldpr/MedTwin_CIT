import mongoose from 'mongoose';
import { ClinicalNote, IClinicalNoteDocument, ClinicalNoteType, User } from '../models';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../utils/roles';

export interface CreateClinicalNoteInput {
  noteType: string;
  title: string;
  content: string;
  encounterDate?: string | Date;
}

/**
 * Create a new clinical note for an authorized patient by a doctor.
 */
export const createClinicalNote = async (
  doctorId: string,
  patientId: string,
  data: CreateClinicalNoteInput
): Promise<IClinicalNoteDocument> => {
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

  if (!data.title || !data.title.trim()) {
    throw new AppError('Clinical note title is required', 400);
  }
  if (data.title.trim().length > 200) {
    throw new AppError('Clinical note title cannot exceed 200 characters', 400);
  }

  if (!data.content || !data.content.trim()) {
    throw new AppError('Clinical note content is required', 400);
  }
  if (data.content.trim().length > 10000) {
    throw new AppError('Clinical note content cannot exceed 10000 characters', 400);
  }

  if (!data.noteType || !data.noteType.trim()) {
    throw new AppError('Clinical note type is required', 400);
  }

  const upperNoteType = data.noteType.trim().toUpperCase();
  if (!Object.values(ClinicalNoteType).includes(upperNoteType as ClinicalNoteType)) {
    throw new AppError(
      `Invalid noteType. Allowed values: ${Object.values(ClinicalNoteType).join(', ')}`,
      400
    );
  }

  let encounterDate = new Date();
  if (data.encounterDate) {
    encounterDate = new Date(data.encounterDate);
    if (isNaN(encounterDate.getTime())) {
      throw new AppError('Invalid encounterDate format', 400);
    }
  }

  const note = await ClinicalNote.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    noteType: upperNoteType as ClinicalNoteType,
    title: data.title.trim(),
    content: data.content.trim(),
    encounterDate,
  });

  await note.populate({ path: 'doctorId', select: 'id name email' });
  return note;
};

/**
 * Retrieve all clinical notes for a patient authored by or accessible to an authorized doctor.
 */
export const getDoctorPatientNotes = async (
  _doctorId: string,
  patientId: string
): Promise<IClinicalNoteDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== UserRole.PATIENT || !patient.isActive) {
    throw new AppError('Patient record not found', 404);
  }

  const notes = await ClinicalNote.find({
    patientId: new mongoose.Types.ObjectId(patientId),
  })
    .sort({ createdAt: -1 })
    .populate({ path: 'doctorId', select: 'id name email' });

  return notes;
};

/**
 * Retrieve own clinical notes for the authenticated patient.
 */
export const getPatientOwnNotes = async (
  patientId: string
): Promise<IClinicalNoteDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const notes = await ClinicalNote.find({
    patientId: new mongoose.Types.ObjectId(patientId),
  })
    .sort({ createdAt: -1 })
    .populate({ path: 'doctorId', select: 'id name email' });

  return notes;
};
