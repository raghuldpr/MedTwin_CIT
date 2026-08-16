import { Router } from 'express';
import { verifyDoctorPinHandler } from '../controllers/consent.controller';
import {
  getTwin,
  getProfile,
  getVitals,
  getMedications,
  getAllergies,
  getOrgans,
  getDocuments,
  getDocumentFile,
} from '../controllers/doctorPatient.controller';
import {
  createNoteHandler,
  getDoctorPatientNotesHandler,
} from '../controllers/clinicalNote.controller';
import {
  createPrescriptionHandler,
  getDoctorPatientPrescriptionsHandler,
  cancelPrescriptionHandler,
} from '../controllers/prescription.controller';
import { checkDrugSafetyHandler } from '../controllers/drugSafety.controller';
import { processDocumentOcrHandler } from '../controllers/documentOcr.controller';
import { emergencyAccessHandler } from '../controllers/emergencyAccess.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { requirePatientConsent } from '../middleware/consent.middleware';
import { pinRateLimiter, aiOcrRateLimiter } from '../middleware/rateLimit.middleware';
import { PermissionLevel } from '../models';
import { UserRole } from '../utils/roles';

const router = Router();

// Emergency Break-Glass Access (Accessible by DOCTOR, audits unauthorized attempts)
router.post(
  '/patients/:patientId/emergency-access',
  authenticate,
  emergencyAccessHandler
);

// Apply Authentication + Doctor Role Authorization to all standard doctor routes
router.use(authenticate, authorizeRoles(UserRole.DOCTOR));

// Doctor Consent Verification (PIN Exchange with Rate Limiting)
router.post('/consents/verify', pinRateLimiter, verifyDoctorPinHandler);

// Authorized Doctor Patient Digital Twin Access
router.get('/patients/:patientId/twin', requirePatientConsent(), getTwin);
router.get('/patients/:patientId/profile', requirePatientConsent(), getProfile);
router.get('/patients/:patientId/vitals', requirePatientConsent(), getVitals);
router.get('/patients/:patientId/medications', requirePatientConsent(), getMedications);
router.get('/patients/:patientId/allergies', requirePatientConsent(), getAllergies);
router.get('/patients/:patientId/organs', requirePatientConsent(), getOrgans);

// Authorized Doctor Patient Medical Documents Access (Requires FULL consent)
router.get(
  '/patients/:patientId/documents',
  requirePatientConsent(PermissionLevel.FULL),
  getDocuments
);
router.get(
  '/patients/:patientId/documents/:documentId',
  requirePatientConsent(PermissionLevel.FULL),
  getDocumentFile
);

// Authorized Doctor Clinical Notes (Requires FULL consent)
router.post(
  '/patients/:patientId/notes',
  requirePatientConsent(PermissionLevel.FULL),
  createNoteHandler
);
router.get(
  '/patients/:patientId/notes',
  requirePatientConsent(PermissionLevel.FULL),
  getDoctorPatientNotesHandler
);

// Authorized Doctor Prescriptions (Requires FULL consent)
router.post(
  '/patients/:patientId/prescriptions',
  requirePatientConsent(PermissionLevel.FULL),
  createPrescriptionHandler
);
router.get(
  '/patients/:patientId/prescriptions',
  requirePatientConsent(PermissionLevel.FULL),
  getDoctorPatientPrescriptionsHandler
);
router.patch(
  '/patients/:patientId/prescriptions/:prescriptionId/cancel',
  requirePatientConsent(PermissionLevel.FULL),
  cancelPrescriptionHandler
);

// AI Drug Safety & Medication Conflict Analysis (Requires FULL consent & Rate Limiting)
router.post(
  '/patients/:patientId/drug-safety-check',
  aiOcrRateLimiter,
  requirePatientConsent(PermissionLevel.FULL),
  checkDrugSafetyHandler
);

// Authorized Doctor Medical Document AI OCR (Requires FULL consent & Rate Limiting)
router.post(
  '/patients/:patientId/documents/:documentId/ocr',
  aiOcrRateLimiter,
  requirePatientConsent(PermissionLevel.FULL),
  processDocumentOcrHandler
);

export default router;
