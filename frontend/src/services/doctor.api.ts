/** Doctor API Service — backend contract-accurate. */
import { post, get } from './api';
import type {
  BackendVital, BackendMedication, BackendAllergy, BackendOrgan, BackendDocument, BackendNote, BackendPrescription,
} from './patient.api';

export interface PatientTwinData {
  patient: {
    id: string;
    name: string;
    email: string;
    dateOfBirth: string | null;
    gender: string | null;
    bloodGroup: string | null;
    heightCm: number | null;
    weightKg: number | null;
    emergencyContact: { name: string; relationship: string; phone: string };
  };
  vitals: BackendVital[];
  medications: BackendMedication[];
  allergies: BackendAllergy[];
  organs: BackendOrgan[];
  access: {
    permissionLevel: 'BASIC' | 'FULL';
    expiresAt: string;
    lastVerifiedAt: string | null;
  };
}

export interface ConsentVerifyResult {
  consentId: string;
  patientId: string;
  doctorId: string;
  permissionLevel: 'BASIC' | 'FULL';
  expiresAt: string;
}

export interface DrugSafetyAnalysis {
  status: string;
  overallRiskScore: number;
  severity: string;
  summary: string;
  drugDrugInteractions: Array<{ drug1: string; drug2: string; severity: string; description: string; recommendation: string }>;
  allergyConflicts: Array<{ allergen: string; medication: string; severity: string; description: string }>;
  contraindications: Array<{ medication: string; condition: string; severity: string; description: string }>;
  duplicateTherapies: Array<{ medications: string[]; description: string }>;
  recommendations: string[];
  disclaimer: string;
  patientDataSummary: { analyzedMedications: string[]; analyzedAllergies: string[] };
}

export const doctorApi = {
  verifyPin: (patientId: string, pin: string) =>
    post<ConsentVerifyResult>('/api/doctor/consents/verify', { patientId, pin }),

  getPatientTwin: (patientId: string) =>
    get<PatientTwinData>(`/api/doctor/patients/${patientId}/twin`),

  getPatientVitals: (patientId: string, page = 1, limit = 20) =>
    get<{ items: BackendVital[]; page: number; limit: number; total: number; totalPages: number }>(
      `/api/doctor/patients/${patientId}/vitals?page=${page}&limit=${limit}`
    ),

  getPatientMedications: (patientId: string) =>
    get<{ medications: BackendMedication[] }>(`/api/doctor/patients/${patientId}/medications`),

  getPatientAllergies: (patientId: string) =>
    get<{ allergies: BackendAllergy[] }>(`/api/doctor/patients/${patientId}/allergies`),

  getPatientOrgans: (patientId: string) =>
    get<{ organs: BackendOrgan[] }>(`/api/doctor/patients/${patientId}/organs`),

  getPatientDocuments: (patientId: string) =>
    get<{ documents: BackendDocument[]; count: number }>(`/api/doctor/patients/${patientId}/documents`),

  getPatientNotes: (patientId: string) =>
    get<{ notes: BackendNote[] }>(`/api/doctor/patients/${patientId}/notes`),

  createNote: (patientId: string, data: { content: string; noteType?: string }) =>
    post<{ note: BackendNote }>(`/api/doctor/patients/${patientId}/notes`, data),

  getPatientPrescriptions: (patientId: string) =>
    get<{ prescriptions: BackendPrescription[] }>(`/api/doctor/patients/${patientId}/prescriptions`),

  createPrescription: (patientId: string, data: {
    medications: Array<{ name: string; dosage: string; frequency: string; instructions?: string }>;
    diagnosis?: string; notes?: string; validUntil?: string;
  }) => post<{ prescription: BackendPrescription }>(`/api/doctor/patients/${patientId}/prescriptions`, data),

  checkDrugSafety: (patientId: string, proposedMedication?: { name: string; dosage?: string; frequency?: string }) =>
    post<{ analysis: DrugSafetyAnalysis }>(`/api/doctor/patients/${patientId}/drug-safety-check`, proposedMedication ? { proposedMedication } : {}),
};
