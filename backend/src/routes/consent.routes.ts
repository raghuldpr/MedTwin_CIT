import { Router } from 'express';
import {
  createConsentHandler,
  listPatientConsentsHandler,
  revokeConsentHandler,
  verifyDoctorPinHandler,
} from '../controllers/consent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { UserRole } from '../utils/roles';

// Patient Consent Router (/api/patient/consents)
export const patientConsentRouter = Router();
patientConsentRouter.use(authenticate, authorizeRoles(UserRole.PATIENT));
patientConsentRouter.post('/', createConsentHandler);
patientConsentRouter.get('/', listPatientConsentsHandler);
patientConsentRouter.delete('/:consentId', revokeConsentHandler);

// Doctor Consent Verification Router (/api/doctor/consents)
export const doctorConsentRouter = Router();
doctorConsentRouter.use(authenticate, authorizeRoles(UserRole.DOCTOR));
doctorConsentRouter.post('/verify', verifyDoctorPinHandler);
