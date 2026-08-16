import { Request, Response, NextFunction } from 'express';
import {
  getPatientProfile,
  upsertPatientProfile,
  getPatientVitals,
  addPatientVital,
  getPatientMedications,
  addPatientMedication,
  getPatientAllergies,
  addPatientAllergy,
  getPatientOrganStatus,
} from '../services/patient.service';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * Helper to ensure authenticated user id is present
 */
const getAuthUserId = (req: Request): string => {
  if (!req.user || !req.user.id) {
    throw new AppError('Authentication required. Missing user identity in context.', 401);
  }
  return req.user.id;
};

/**
 * GET /api/patient/profile
 * Retrieve authenticated patient's Digital Twin profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const profile = await getPatientProfile(userId);

    sendResponse(res, 200, {
      success: true,
      data: {
        profile: profile || null,
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/patient/profile
 * Create or update authenticated patient's Digital Twin profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const { dateOfBirth, gender, bloodGroup, heightCm, weightKg, emergencyContact } = req.body;

    const profile = await upsertPatientProfile(userId, {
      dateOfBirth,
      gender,
      bloodGroup,
      heightCm,
      weightKg,
      emergencyContact,
    });

    sendResponse(res, 200, {
      success: true,
      message: 'Patient Digital Twin profile updated successfully',
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/vitals
 * Retrieve paginated recent vitals for authenticated patient
 */
export const getVitals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await getPatientVitals(userId, page, limit);

    sendResponse(res, 200, {
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patient/vitals
 * Add new vital signs entry for authenticated patient
 */
export const addVital = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const {
      heartRate,
      systolicBP,
      diastolicBP,
      spo2,
      bloodGlucose,
      temperatureC,
      recordedAt,
      source,
    } = req.body;

    const vital = await addPatientVital(userId, {
      heartRate,
      systolicBP,
      diastolicBP,
      spo2,
      bloodGlucose,
      temperatureC,
      recordedAt,
      source,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Vital signs recorded successfully',
      data: {
        vital,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/medications
 * Retrieve authenticated patient's medications
 */
export const getMedications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const medications = await getPatientMedications(userId);

    sendResponse(res, 200, {
      success: true,
      data: {
        medications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patient/medications
 * Add medication information for authenticated patient
 */
export const addMedication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const { name, dosage, frequency, route, startDate, endDate, instructions, active } = req.body;

    const medication = await addPatientMedication(userId, {
      name,
      dosage,
      frequency,
      route,
      startDate,
      endDate,
      instructions,
      active,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Medication added successfully',
      data: {
        medication,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/allergies
 * Retrieve authenticated patient's allergies
 */
export const getAllergies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const allergies = await getPatientAllergies(userId);

    sendResponse(res, 200, {
      success: true,
      data: {
        allergies,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patient/allergies
 * Add allergy record for authenticated patient
 */
export const addAllergy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const { allergen, reaction, severity, notes } = req.body;

    const allergy = await addPatientAllergy(userId, {
      allergen,
      reaction,
      severity,
      notes,
    });

    sendResponse(res, 201, {
      success: true,
      message: 'Allergy record added successfully',
      data: {
        allergy,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/organs
 * Retrieve authenticated patient's organ system status
 */
export const getOrgans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    const organs = await getPatientOrganStatus(userId);

    sendResponse(res, 200, {
      success: true,
      data: {
        organs,
      },
    });
  } catch (error) {
    next(error);
  }
};
