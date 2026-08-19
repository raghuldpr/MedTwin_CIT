import mongoose from 'mongoose';
import { User } from '../models/User';

/**
 * Resolves a patientId input string to a valid 24-character MongoDB ObjectId.
 * Supports:
 * - Direct 24-hex ObjectId strings
 * - Alias keywords: 'patient1', 'patient2', 'patient3', 'pt-1', 'pt-2', 'pt-3', 'patient'
 * - Email addresses (e.g. 'patient@medtwin.test')
 */
export const resolvePatientId = async (input: string): Promise<string | null> => {
  if (!input) return null;
  const clean = input.trim();

  // 1. Valid Mongo ObjectId
  if (mongoose.Types.ObjectId.isValid(clean) && clean.length === 24) {
    return clean;
  }

  // 2. Alias shortcuts
  const lower = clean.toLowerCase();
  if (lower === 'patient1' || lower === 'pt-1' || lower === 'patient' || lower === 'hardish') {
    const u = await User.findOne({ email: 'patient@medtwin.test' });
    return u ? u._id.toString() : null;
  }
  if (lower === 'patient2' || lower === 'pt-2' || lower === 'aarav') {
    const u = await User.findOne({ email: 'patient2@medtwin.test' });
    return u ? u._id.toString() : null;
  }
  if (lower === 'patient3' || lower === 'pt-3' || lower === 'sunita') {
    const u = await User.findOne({ email: 'patient3@medtwin.test' });
    return u ? u._id.toString() : null;
  }

  // 3. Email lookup
  const userByEmail = await User.findOne({ email: lower });
  if (userByEmail) return userByEmail._id.toString();

  return null;
};
