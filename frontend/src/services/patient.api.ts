/**
 * Patient API Service — matches backend contracts exactly.
 * Never falls back to mock data.
 */
import { get, post, put, del, postForm } from './api';

// ---- Backend Model Types (source of truth) ----

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendProfile {
  userId?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

export interface BackendVital {
  id: string;
  patientId: string;
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spo2?: number;
  bloodGlucose?: number;
  temperatureC?: number;
  recordedAt: string;
  source: 'MANUAL' | 'DEVICE' | 'IMPORTED';
  createdAt?: string;
}

export interface BackendMedication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  startDate?: string;
  endDate?: string | null;
  instructions?: string;
  active: boolean;
  prescribedBy?: string | null;
  createdAt?: string;
}

export interface BackendAllergy {
  id: string;
  patientId: string;
  allergen: string;
  reaction?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC';
  notes?: string;
  createdAt?: string;
}

export interface BackendOrgan {
  id: string;
  patientId: string;
  system: string;
  status: 'NORMAL' | 'MONITOR' | 'ABNORMAL' | 'CRITICAL';
  summary?: string;
  lastUpdated: string;
}

export interface BackendConsent {
  id: string;
  consentId: string;
  patientId: string;
  doctorId: string | null;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  permissionLevel: 'BASIC' | 'FULL';
  failedAttempts: number;
  lockedUntil?: string | null;
  lastVerifiedAt?: string | null;
  createdAt: string;
}

export interface BackendDocument {
  id: string;
  patientId: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  documentType: string;
  description?: string;
  ocrStatus: string;
  extractedData?: unknown | null;
  createdAt: string;
}

export interface BackendNote {
  id: string;
  patientId: string;
  doctorId: string;
  content: string;
  noteType?: string;
  createdAt: string;
}

export interface BackendPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: Array<{ name: string; dosage: string; frequency: string; instructions?: string }>;
  diagnosis?: string;
  notes?: string;
  status: string;
  validUntil?: string;
  createdAt: string;
}

// ---- API Calls ----

export const patientApi = {
  getProfile: () =>
    get<{ profile: BackendProfile | null; user: BackendUser }>('/api/patient/profile'),

  updateProfile: (data: Partial<BackendProfile>) =>
    put<{ profile: BackendProfile }>('/api/patient/profile', data),

  getVitals: (page = 1, limit = 20) =>
    get<{ vitals: BackendVital[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/patient/vitals?page=${page}&limit=${limit}`
    ),

  addVital: (data: {
    heartRate?: number; systolicBP?: number; diastolicBP?: number;
    spo2?: number; bloodGlucose?: number; temperatureC?: number;
    recordedAt?: string; source?: string;
  }) => post<{ vital: BackendVital }>('/api/patient/vitals', data),

  getMedications: () =>
    get<{ medications: BackendMedication[] }>('/api/patient/medications'),

  addMedication: (data: {
    name: string; dosage: string; frequency: string;
    route?: string; instructions?: string; startDate?: string;
  }) => post<{ medication: BackendMedication }>('/api/patient/medications', data),

  getAllergies: () =>
    get<{ allergies: BackendAllergy[] }>('/api/patient/allergies'),

  addAllergy: (data: {
    allergen: string; reaction?: string; severity?: string; notes?: string;
  }) => post<{ allergy: BackendAllergy }>('/api/patient/allergies', data),

  getOrgans: () =>
    get<{ organs: BackendOrgan[] }>('/api/patient/organs'),

  getConsents: () =>
    get<{ consents: BackendConsent[] }>('/api/patient/consents'),

  createConsent: (data: {
    expiresInMinutes?: number;
    permissionLevel?: string;
    doctorId?: string;
  }) => post<{
    consentId: string;
    pin: string;
    expiresAt: string;
    permissionLevel: string;
    doctorId: string | null;
  }>('/api/patient/consents', data),

  revokeConsent: (consentId: string) =>
    del<{ consent: BackendConsent }>(`/api/patient/consents/${consentId}`),

  getDocuments: () =>
    get<{ documents: BackendDocument[]; count: number }>('/api/patient/documents'),

  uploadDocument: (formData: FormData) =>
    postForm<{ document: BackendDocument }>('/api/patient/documents', formData),

  getDocumentUrl: (documentId: string) => `/api/patient/documents/${documentId}`,

  deleteDocument: (documentId: string) =>
    del(`/api/patient/documents/${documentId}`),

  getNotes: () =>
    get<{ notes: BackendNote[] }>('/api/patient/notes'),

  getPrescriptions: () =>
    get<{ prescriptions: BackendPrescription[] }>('/api/patient/prescriptions'),
};
