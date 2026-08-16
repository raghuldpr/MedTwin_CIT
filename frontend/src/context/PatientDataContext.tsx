/**
 * PatientDataContext
 * Fetches all patient data once in parallel and shares it across:
 *   Dashboard, DigitalTwinFullPage, HealthSummaryPage
 *
 * No mock fallbacks. Backend is source of truth.
 * Errors are surfaced explicitly — pages show proper error states.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { patientApi } from '../services/patient.api';
import { useAuth } from './AuthContext';
import type {
  BackendProfile, BackendUser, BackendVital, BackendMedication,
  BackendAllergy, BackendOrgan,
} from '../services/patient.api';
import { ApiError } from '../services/api';

export interface PatientDataState {
  isLoading: boolean;
  error: string | null;
  user: BackendUser | null;
  profile: BackendProfile | null;
  vitals: BackendVital[];
  medications: BackendMedication[];
  allergies: BackendAllergy[];
  organs: BackendOrgan[];
  lastFetchedAt: Date | null;
}

interface PatientDataContextValue extends PatientDataState {
  reload: () => void;
}

const PatientDataContext = createContext<PatientDataContextValue | null>(null);

export const usePatientData = (): PatientDataContextValue => {
  const ctx = useContext(PatientDataContext);
  if (!ctx) throw new Error('usePatientData must be used within PatientDataProvider');
  return ctx;
};

interface Props { children: ReactNode; }

export const PatientDataProvider: React.FC<Props> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [state, setState] = useState<PatientDataState>({
    isLoading: true,
    error: null,
    user: null,
    profile: null,
    vitals: [],
    medications: [],
    allergies: [],
    organs: [],
    lastFetchedAt: null,
  });

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch profile + vitals + medications + allergies + organs all in parallel
      const [profileResult, vitalsResult, medsResult, allergiesResult, organsResult] = await Promise.allSettled([
        patientApi.getProfile(),
        patientApi.getVitals(1, 10),
        patientApi.getMedications(),
        patientApi.getAllergies(),
        patientApi.getOrgans(),
      ]);

      const errors: string[] = [];

      let profile: BackendProfile | null = null;
      let user: BackendUser | null = authUser;
      if (profileResult.status === 'fulfilled') {
        profile = profileResult.value.profile;
        user = profileResult.value.user ?? authUser;
      } else {
        errors.push(`Profile: ${profileResult.reason instanceof ApiError ? profileResult.reason.message : 'Failed to load'}`);
      }

      const vitals = vitalsResult.status === 'fulfilled' ? vitalsResult.value.vitals : [];
      if (vitalsResult.status === 'rejected') {
        errors.push(`Vitals: ${vitalsResult.reason instanceof ApiError ? vitalsResult.reason.message : 'Failed to load'}`);
      }

      const medications = medsResult.status === 'fulfilled' ? medsResult.value.medications : [];
      if (medsResult.status === 'rejected') {
        errors.push(`Medications: ${medsResult.reason instanceof ApiError ? medsResult.reason.message : 'Failed to load'}`);
      }

      const allergies = allergiesResult.status === 'fulfilled' ? allergiesResult.value.allergies : [];
      if (allergiesResult.status === 'rejected') {
        errors.push(`Allergies: ${allergiesResult.reason instanceof ApiError ? allergiesResult.reason.message : 'Failed to load'}`);
      }

      const organs = organsResult.status === 'fulfilled' ? organsResult.value.organs : [];
      if (organsResult.status === 'rejected') {
        errors.push(`Organs: ${organsResult.reason instanceof ApiError ? organsResult.reason.message : 'Failed to load'}`);
      }

      setState({
        isLoading: false,
        error: errors.length > 0 ? errors.join(' | ') : null,
        user,
        profile,
        vitals,
        medications,
        allergies,
        organs,
        lastFetchedAt: new Date(),
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load patient data. Please check your connection.';
      setState((prev) => ({ ...prev, isLoading: false, error: msg }));
    }
  }, [isAuthenticated, authUser]);

  useEffect(() => {
    if (isAuthenticated) { fetchAll(); }
    else { setState({ isLoading: false, error: null, user: null, profile: null, vitals: [], medications: [], allergies: [], organs: [], lastFetchedAt: null }); }
  }, [isAuthenticated, fetchAll]);

  return (
    <PatientDataContext.Provider value={{ ...state, reload: fetchAll }}>
      {children}
    </PatientDataContext.Provider>
  );
};
