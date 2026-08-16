import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getVitals,
  addVital,
  getMedications,
  addMedication,
  getAllergies,
  addAllergy,
  getOrgans,
} from '../controllers/patient.controller';
import {
  createConsentHandler,
  listPatientConsentsHandler,
  revokeConsentHandler,
} from '../controllers/consent.controller';
import {
  uploadDocument,
  listDocuments,
  getDocumentFile,
  getDocumentMetadata,
  deleteDocument,
} from '../controllers/document.controller';
import { processDocumentOcrHandler } from '../controllers/documentOcr.controller';
import { getPatientNotesHandler } from '../controllers/clinicalNote.controller';
import { getPatientPrescriptionsHandler } from '../controllers/prescription.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { uploadMedicalDocument } from '../middleware/upload.middleware';
import { uploadRateLimiter, aiOcrRateLimiter } from '../middleware/rateLimit.middleware';
import { UserRole } from '../utils/roles';

const router = Router();

// Medical Document AI OCR Extraction (Accessible by Patient for own doc, or Doctor with active FULL consent)
router.post(
  '/documents/:documentId/ocr',
  aiOcrRateLimiter,
  authenticate,
  authorizeRoles(UserRole.PATIENT, UserRole.DOCTOR),
  processDocumentOcrHandler
);

// Apply Authentication + Patient Role Authorization to all standard patient routes
router.use(authenticate, authorizeRoles(UserRole.PATIENT));

// Digital Twin Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Vital Signs
router.get('/vitals', getVitals);
router.post('/vitals', addVital);

// Medications
router.get('/medications', getMedications);
router.post('/medications', addMedication);

// Allergies
router.get('/allergies', getAllergies);
router.post('/allergies', addAllergy);

// Organ System Status
router.get('/organs', getOrgans);

// Doctor Access Consents (Patient controlled)
router.post('/consents', createConsentHandler);
router.get('/consents', listPatientConsentsHandler);
router.delete('/consents/:consentId', revokeConsentHandler);

// Medical Document Vault (Patient controlled with Upload Rate Limiting)
router.post('/documents', uploadRateLimiter, uploadMedicalDocument, uploadDocument);
router.get('/documents', listDocuments);
router.get('/documents/:documentId', getDocumentFile);
router.get('/documents/:documentId/metadata', getDocumentMetadata);
router.delete('/documents/:documentId', deleteDocument);

// Clinical Notes (Patient view own notes)
router.get('/notes', getPatientNotesHandler);

// Prescriptions (Patient view own prescriptions)
router.get('/prescriptions', getPatientPrescriptionsHandler);

export default router;
