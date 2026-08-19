import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { DoctorPortal } from './components/DoctorPortal';
import { patientApi, BackendVital, BackendMedication, BackendDocument } from './services/patient.api';
import { voiceApi } from './services/voice.api';
import { initialPatient, alternatePatient } from './data/patient';
import { liveVitalsData } from './data/vitals';
import { organsData } from './data/organs';
import { medicationsData } from './data/medications';
import { documentsData } from './data/documents';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { DigitalTwinHero } from './components/DigitalTwinHero';
import { LiveVitals } from './components/LiveVitals';
import { AIHealthSummary } from './components/AIHealthSummary';
import { OrganDetailPage } from './components/OrganDetailPage';
import { MedicationList } from './components/MedicationList';
import { DocumentList } from './components/DocumentList';
import { VitalsView } from './components/VitalsView';
import { AppointmentsList } from './components/AppointmentsList';
import { ConsentSettings } from './components/ConsentSettings';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Medication, MedicalDocument, VitalMetric } from './types';
import { Mic, Check, LogOut, RefreshCw, UserCheck, Stethoscope } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activeRole, setActiveRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [patient, setPatient] = useState(initialPatient);
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [selectedOrganSlug, setSelectedOrganSlug] = useState<string | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [vitals, setVitals] = useState<VitalMetric[]>(liveVitalsData);
  const [medications, setMedications] = useState<Medication[]>(medicationsData);
  const [documents, setDocuments] = useState<MedicalDocument[]>(documentsData);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Sync role from authenticated user
  useEffect(() => {
    if (user?.role) {
      setActiveRole(user.role as 'PATIENT' | 'DOCTOR');
    }
  }, [user]);

  // Update displayed patient name from authenticated user profile
  useEffect(() => {
    if (user) {
      setPatient((prev) => ({
        ...prev,
        id: user.id || prev.id,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Fetch live backend patient data when authenticated as Patient
  useEffect(() => {
    if (!isAuthenticated || activeRole !== 'PATIENT') return;

    const loadBackendData = async () => {
      setIsFetchingData(true);
      try {
        // 1. Load Vitals
        try {
          const vitalsRes = await patientApi.getVitals();
          if (vitalsRes.vitals && vitalsRes.vitals.length > 0) {
            const mappedVitals: VitalMetric[] = vitalsRes.vitals.map((v: BackendVital) => ({
              id: v.id,
              name: 'Heart Rate',
              value: v.heartRate ?? 72,
              unit: 'bpm',
              status: (v.heartRate ?? 72) > 100 ? 'warning' : 'normal',
              normalRange: '60-100',
              iconName: 'Heart',
              color: 'emerald',
              trend: [68, 70, 72, v.heartRate ?? 72],
            }));
            setVitals(mappedVitals);
          }
        } catch {
          // Fallback default
        }

        // 2. Load Medications
        try {
          const medsRes = await patientApi.getMedications();
          if (medsRes.medications && medsRes.medications.length > 0) {
            const mappedMeds: Medication[] = medsRes.medications.map((m: BackendMedication) => ({
              id: m.id,
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              time: '08:00 AM',
              status: m.active ? 'Upcoming' : 'Taken',
              category: 'cardiac',
              instructions: m.instructions || 'Take with water',
              startDate: m.startDate || '2026-01-01',
              prescribedBy: m.prescribedBy || 'Dr. Priya Sharma',
            }));
            setMedications(mappedMeds);
          }
        } catch {
          // Fallback default
        }

        // 3. Load Documents
        try {
          const docsRes = await patientApi.getDocuments();
          if (docsRes.documents && docsRes.documents.length > 0) {
            const mappedDocs: MedicalDocument[] = docsRes.documents.map((d: BackendDocument) => ({
              id: d.id,
              title: d.originalFileName,
              type: d.mimeType.includes('image') ? 'Image' : 'PDF',
              category: 'Reports',
              date: new Date(d.createdAt).toLocaleDateString(),
              size: `${(d.fileSize / 1024).toFixed(1)} KB`,
              summary: d.description || 'Medical Document telemetry sync',
            }));
            setDocuments(mappedDocs);
          }
        } catch {
          // Fallback default
        }
      } finally {
        setIsFetchingData(false);
      }
    };

    loadBackendData();
  }, [isAuthenticated, activeRole]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400">Initializing MedTwin Telemetry Engine...</p>
      </div>
    );
  }

  // Render Auth Login Page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // RENDER DEDICATED DOCTOR PORTAL WORKSPACE WHEN ROLE IS DOCTOR
  if (activeRole === 'DOCTOR') {
    return <DoctorPortal onLogout={logout} />;
  }

  // RENDER PATIENT TELEMETRY PORTAL WHEN ROLE IS PATIENT
  const handleSwitchPatient = () => {
    setPatient((prev) => (prev.id === 'pt-1' ? alternatePatient : initialPatient));
  };

  const handleSelectOrgan = (organSlug: string) => {
    setSelectedOrganSlug(organSlug);
  };

  const handleAddMedication = async (newMed: Medication) => {
    setMedications((prev) => [newMed, ...prev]);
    try {
      await patientApi.addMedication({
        name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        instructions: newMed.instructions,
      });
    } catch (err) {
      console.warn('Failed to sync new medication to backend:', err);
    }
  };

  const handleToggleMedStatus = (medId: string) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          const isTaken = m.status === 'Taken';
          return {
            ...m,
            status: isTaken ? 'Upcoming' : 'Taken',
            dueText: isTaken ? 'In 4 hours' : 'Taken just now',
          };
        }
        return m;
      })
    );
  };

  // Upload medical document handler
  const handleUploadDocument = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'LAB_RESULT');
      formData.append('description', 'Uploaded via MedTwin Web Portal');

      try {
        const result = await patientApi.uploadDocument(formData);
        if (result.document) {
          const newDoc: MedicalDocument = {
            id: result.document.id,
            title: result.document.originalFileName,
            type: result.document.mimeType.includes('image') ? 'Image' : 'PDF',
            category: 'Reports',
            date: 'Just now',
            size: `${(result.document.fileSize / 1024).toFixed(1)} KB`,
            summary: 'Uploaded and processed via AI OCR Engine',
          };
          setDocuments((prev) => [newDoc, ...prev]);
        }
      } catch {
        const newDoc: MedicalDocument = {
          id: `doc-${Date.now()}`,
          title: file.name,
          type: file.type.includes('image') ? 'Image' : 'PDF',
          category: 'Reports',
          date: 'Just now',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          summary: 'Uploaded via browser',
        };
        setDocuments((prev) => [newDoc, ...prev]);
      }
    };
    input.click();
  };

  const handleVoiceCommand = async (cmd: string) => {
    try {
      const res = await voiceApi.processCommand(cmd);
      if (res.action === 'NAVIGATE' && res.target) {
        if (res.target === 'vitals') setActiveNav('vitals');
        else if (res.target === 'medications') setActiveNav('medications');
        else if (res.target === 'documents') setActiveNav('documents');
      }
    } catch {
      // Graceful voice fallback
    }
  };

  if (selectedOrganSlug && organsData[selectedOrganSlug]) {
    return (
      <OrganDetailPage
        organ={organsData[selectedOrganSlug]}
        onBack={() => setSelectedOrganSlug(null)}
        onSelectOrgan={(slug) => setSelectedOrganSlug(slug)}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden select-none">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeNav={activeNav}
          onNavigate={(nav) => {
            setActiveNav(nav);
            setSelectedOrganSlug(null);
          }}
          patient={patient}
          onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
          onSwitchPatient={handleSwitchPatient}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 gap-6 pb-24 lg:pb-8">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <Header
            patient={patient}
            onOpenNotifications={() => setShowNotifications(!showNotifications)}
            onSwitchPatient={handleSwitchPatient}
          />
          <div className="flex items-center gap-2 shrink-0">
            {/* Role Demo Switcher */}
            <button
              onClick={() => setActiveRole(activeRole === 'PATIENT' ? 'DOCTOR' : 'PATIENT')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Switch demo portal view"
            >
              {activeRole === 'PATIENT' ? (
                <>
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" /> Switch to Doctor Portal
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Switch to Patient Portal
                </>
              )}
            </button>

            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Log out of session"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Syncing Indicator */}
        {isFetchingData && (
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50/80 border border-blue-100 p-2.5 rounded-2xl animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing telemetry with MedTwin Backend...</span>
          </div>
        )}

        {/* Notifications Dropdown Toast */}
        {showNotifications && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xl max-w-md ml-auto animate-in fade-in slide-in-from-top-2 z-40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Clinical Alerts</span>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-[11px] text-blue-600 font-semibold cursor-pointer"
              >
                Dismiss All
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">Amlodipine 5mg Due</div>
                  <div className="text-slate-500 text-[11px]">Scheduled intake recommended at 08:00 AM</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">ECG Telemetry Verified</div>
                  <div className="text-slate-500 text-[11px]">Cardiovascular twin model synced with smart wearable</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Views by Navigation */}
        {activeNav === 'dashboard' && (
          <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
            {/* Left Column: Digital Twin & AI Health Summary */}
            <div className="flex-1 xl:flex-[1.5] flex flex-col gap-6">
              {/* Digital Twin 3D Hero Card */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col p-2 sm:p-4">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent pointer-events-none" />
                <DigitalTwinHero
                  onSelectOrgan={handleSelectOrgan}
                  selectedOrgan="heart"
                  variant="light"
                />
              </div>

              {/* AI Health Summary Card */}
              <AIHealthSummary
                onViewFullReport={() => setActiveNav('health-summary')}
              />
            </div>

            {/* Right Column: Live Vitals & Quick Meds */}
            <div className="w-full xl:w-80 2xl:w-96 flex flex-col gap-6">
              {/* Live Vitals Card */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xs flex flex-col">
                <LiveVitals
                  vitals={vitals}
                  onViewAll={() => setActiveNav('vitals')}
                  onSelectVital={() => setActiveNav('vitals')}
                />
              </div>

              {/* Quick Meds Card */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Medications</h3>
                  <button
                    onClick={() => setActiveNav('medications')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {medications.slice(0, 3).map((med) => {
                    const isTaken = med.status === 'Taken';
                    return (
                      <div
                        key={med.id}
                        onClick={() => handleToggleMedStatus(med.id)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-blue-100 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              isTaken ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'
                            }`}
                          />
                          <div>
                            <p
                              className={`text-xs font-bold ${
                                isTaken ? 'text-slate-400 line-through' : 'text-slate-900'
                              }`}
                            >
                              {med.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {med.time} • {med.dosage}
                            </p>
                          </div>
                        </div>

                        {isTaken ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md flex items-center gap-1 border border-emerald-200">
                            <Check className="w-3 h-3" /> Taken
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {med.dueText || 'Upcoming'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Digital Twin Dedicated View */}
        {activeNav === 'digital-twin' && (
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
            <DigitalTwinHero
              onSelectOrgan={handleSelectOrgan}
              selectedOrgan="heart"
              variant="light"
            />
          </div>
        )}

        {/* Biomarkers / Vitals Full View */}
        {activeNav === 'vitals' && <VitalsView vitals={vitals} />}

        {/* Medications Management View */}
        {activeNav === 'medications' && (
          <MedicationList
            medications={medications}
            onAddMedication={handleAddMedication}
            onToggleStatus={handleToggleMedStatus}
          />
        )}

        {/* Medical Documents View */}
        {activeNav === 'documents' && (
          <DocumentList
            documents={documents}
            onUploadDocument={handleUploadDocument}
          />
        )}

        {/* Health Summary View */}
        {activeNav === 'health-summary' && (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <AIHealthSummary />
          </div>
        )}

        {/* Appointments View */}
        {activeNav === 'appointments' && <AppointmentsList />}

        {/* Consent & Access Governance */}
        {activeNav === 'consent' && <ConsentSettings />}

        {/* Settings View */}
        {activeNav === 'settings' && (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <ConsentSettings />
          </div>
        )}
      </main>

      {/* Floating Microphone Action Button */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white ring-8 ring-blue-600/15 hover:scale-105 hover:bg-blue-700 transition-all cursor-pointer group"
          title="Open MedTwin Voice Assistant"
        >
          <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNavigateToSection={(section) => {
          handleVoiceCommand(section);
          if (section === 'vitals') setActiveNav('vitals');
          else if (section === 'medications') setActiveNav('medications');
          else if (section === 'documents') setActiveNav('documents');
          else setActiveNav('health-summary');
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeNav={activeNav}
        onNavigate={(item) => {
          setActiveNav(item);
          setSelectedOrganSlug(null);
        }}
        onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
      />
    </div>
  );
}
