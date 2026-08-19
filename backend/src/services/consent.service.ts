import mongoose from 'mongoose';
import {
  AccessConsent,
  IAccessConsentDocument,
  ConsentStatus,
  PermissionLevel,
  User,
} from '../models';
import { generatePin } from '../utils/generatePin';
import { hashPin, compareHashes } from '../utils/hash';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../utils/roles';
import { resolvePatientId } from '../utils/resolvePatientId';

// Allowed expiration windows in minutes
export const ALLOWED_EXPIRATION_MINUTES = [15, 30, 60, 240, 1440, 10080];
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * 1. Generate a new secure 6-digit access PIN and consent record for a patient.
 */
export const generateConsent = async (
  patientId: string,
  options: {
    expiresInMinutes?: number;
    permissionLevel?: PermissionLevel | string;
    doctorId?: string;
  }
): Promise<{
  consentId: string;
  pin: string;
  expiresAt: Date;
  permissionLevel: PermissionLevel;
  doctorId: string | null;
}> => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  const expiresInMinutes = options.expiresInMinutes || 60;
  if (!ALLOWED_EXPIRATION_MINUTES.includes(expiresInMinutes)) {
    throw new AppError(
      `Invalid expiresInMinutes. Allowed values are: ${ALLOWED_EXPIRATION_MINUTES.join(', ')} minutes.`,
      400
    );
  }

  let permission = PermissionLevel.FULL;
  if (options.permissionLevel) {
    const upperPerm = String(options.permissionLevel).toUpperCase();
    if (!Object.values(PermissionLevel).includes(upperPerm as PermissionLevel)) {
      throw new AppError(
        `Invalid permissionLevel. Allowed values: ${Object.values(PermissionLevel).join(', ')}`,
        400
      );
    }
    permission = upperPerm as PermissionLevel;
  }

  let targetDoctorObjectId: mongoose.Types.ObjectId | null = null;
  if (options.doctorId) {
    if (!mongoose.Types.ObjectId.isValid(options.doctorId)) {
      throw new AppError('Invalid doctorId format', 400);
    }
    const doctorUser = await User.findById(options.doctorId);
    if (!doctorUser || doctorUser.role !== UserRole.DOCTOR || !doctorUser.isActive) {
      throw new AppError('Specified doctor account was not found or is inactive', 400);
    }
    targetDoctorObjectId = new mongoose.Types.ObjectId(options.doctorId);
  }

  // Generate cryptographically random 6-digit PIN and SHA-256 hash
  const pin = generatePin();
  const pinHash = hashPin(pin);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const consent = await AccessConsent.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: targetDoctorObjectId,
    pinHash,
    expiresAt,
    status: ConsentStatus.ACTIVE,
    permissionLevel: permission,
    failedAttempts: 0,
    lockedUntil: null,
    lastVerifiedAt: null,
  });

  return {
    consentId: consent._id.toString(),
    pin, // The plaintext PIN is returned strictly once upon generation
    expiresAt,
    permissionLevel: permission,
    doctorId: targetDoctorObjectId ? targetDoctorObjectId.toString() : null,
  };
};

/**
 * 2. Retrieve all consent records created by the authenticated patient.
 */
export const getPatientConsents = async (
  patientId: string
): Promise<IAccessConsentDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient user ID format', 400);
  }

  const now = new Date();

  // Lazy update: Mark any active consents whose expiration has passed as EXPIRED
  await AccessConsent.updateMany(
    {
      patientId,
      status: ConsentStatus.ACTIVE,
      expiresAt: { $lte: now },
    },
    { $set: { status: ConsentStatus.EXPIRED } }
  );

  const consents = await AccessConsent.find({ patientId }).sort({ createdAt: -1 });
  return consents;
};

/**
 * 3. Revoke an active consent belonging to the authenticated patient.
 */
export const revokeConsent = async (
  patientId: string,
  consentId: string
): Promise<IAccessConsentDocument> => {
  if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(consentId)) {
    throw new AppError('Invalid ID format provided', 400);
  }

  const consent = await AccessConsent.findOne({ _id: consentId, patientId });
  if (!consent) {
    throw new AppError('Consent record not found or does not belong to you', 404);
  }

  consent.status = ConsentStatus.REVOKED;
  await consent.save();

  return consent;
};

/**
 * 4. Doctor verifies a patient-provided 6-digit PIN to establish access.
 */
export const verifyDoctorPin = async (
  doctorId: string,
  patientId: string,
  pin: string
): Promise<{
  consentId: string;
  patientId: string;
  doctorId: string;
  permissionLevel: PermissionLevel;
  expiresAt: Date;
}> => {
  const resolvedPatientId = (await resolvePatientId(patientId)) || patientId;

  if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
    throw new AppError('Invalid ID format provided', 400);
  }

  if (!pin || !/^[0-9]{6}$/.test(String(pin).trim())) {
    throw new AppError('Invalid PIN format. PIN must be exactly 6 numeric digits.', 400);
  }

  const cleanPin = String(pin).trim();
  const now = new Date();

  // Find candidate active consent for this patient
  const candidateConsents = await AccessConsent.find({
    patientId: new mongoose.Types.ObjectId(resolvedPatientId),
    status: ConsentStatus.ACTIVE,
    $or: [
      { doctorId: null },
      { doctorId: new mongoose.Types.ObjectId(doctorId) },
    ],
  }).select('+pinHash');

  if (!candidateConsents || candidateConsents.length === 0) {
    throw new AppError('Invalid or expired access authorization.', 403);
  }

  const suppliedPinHash = hashPin(cleanPin);
  let matchedConsent: IAccessConsentDocument | null = null;

  for (const consent of candidateConsents) {
    // Check if expired
    if (consent.expiresAt <= now) {
      consent.status = ConsentStatus.EXPIRED;
      await consent.save();
      continue;
    }

    // Check brute-force lock
    if (consent.lockedUntil && consent.lockedUntil > now) {
      continue;
    }

    // Compare hashes safely
    if (compareHashes(suppliedPinHash, consent.pinHash)) {
      matchedConsent = consent;
      break;
    } else {
      // Record failed attempt
      consent.failedAttempts = (consent.failedAttempts || 0) + 1;
      if (consent.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        consent.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await consent.save();
    }
  }

  if (!matchedConsent) {
    throw new AppError('Invalid or expired access authorization.', 403);
  }

  // Successful verification -> reset locks, assign doctor if not bound, update timestamp
  matchedConsent.failedAttempts = 0;
  matchedConsent.lockedUntil = null;
  matchedConsent.lastVerifiedAt = new Date();
  matchedConsent.doctorId = new mongoose.Types.ObjectId(doctorId);
  await matchedConsent.save();

  return {
    consentId: matchedConsent._id.toString(),
    patientId,
    doctorId,
    permissionLevel: matchedConsent.permissionLevel,
    expiresAt: matchedConsent.expiresAt,
  };
};

/**
 * 5. Verify active doctor consent for a specific patient.
 * Used by doctor clinical services/middleware to guard patient records.
 */
export const getActiveDoctorConsent = async (
  doctorId: string,
  patientId: string,
  requiredPermission?: PermissionLevel
): Promise<IAccessConsentDocument | null> => {
  const resolvedPatientId = (await resolvePatientId(patientId)) || patientId;

  if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
    return null;
  }

  const now = new Date();

  // Lazy update: Mark any expired active consent records as EXPIRED
  await AccessConsent.updateMany(
    {
      patientId: new mongoose.Types.ObjectId(resolvedPatientId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      status: ConsentStatus.ACTIVE,
      expiresAt: { $lte: now },
    },
    { $set: { status: ConsentStatus.EXPIRED } }
  );

  const query: Record<string, unknown> = {
    patientId: new mongoose.Types.ObjectId(resolvedPatientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    status: ConsentStatus.ACTIVE,
    expiresAt: { $gt: now },
  };

  if (requiredPermission === PermissionLevel.FULL) {
    query.permissionLevel = PermissionLevel.FULL;
  }

  const consent = await AccessConsent.findOne(query).sort({ createdAt: -1 });

  if (!consent) {
    return null;
  }

  return consent;
};
