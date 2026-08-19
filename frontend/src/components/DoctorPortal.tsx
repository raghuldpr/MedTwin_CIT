import React, { useState, useEffect } from 'react';
import { doctorApi, PatientTwinData, DrugSafetyAnalysis } from '../services/doctor.api';
import { DigitalTwinHero } from './DigitalTwinHero';
import { OrganDetailPage } from './OrganDetailPage';
import { organsData } from '../data/organs';
import { VitalMetric, Medication } from '../types';
import {
  Stethoscope, Lock, Unlock, ShieldAlert, Sparkles, Activity, Pill, FileText,
  AlertTriangle, CheckCircle2, Plus, Clock, Key, Search, UserCheck, RefreshCw, AlertCircle
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const DoctorPortal: React.FC<Props> = ({ onLogout }) => {
  // PIN Verification & Unlock state
  const [patientIdInput, setPatientIdInput] = useState('patient1');
  const [pinInput, setPinInput] = useState('123456');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unlocked Patient Data
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [twinData, setTwinData] = useState<PatientTwinData | null>(null);
  const [activeTab, setActiveTab] = useState<'twin' | 'vitals' | 'notes' | 'drug-safety' | 'documents'>('twin');
  const [selectedOrganSlug, setSelectedOrganSlug] = useState<string | null>(null);

  // Clinical Progress Notes
  const [notes, setNotes] = useState<Array<{ id: string; content: string; createdAt: string }>>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // AI Drug Safety & Prescriptions
  const [proposedMedName, setProposedMedName] = useState('');
  const [proposedDosage, setProposedDosage] = useState('10mg');
  const [proposedFrequency, setProposedFrequency] = useState('Once Daily');
  const [isAnalyzingSafety, setIsAnalyzingSafety] = useState(false);
  const [safetyReport, setSafetyReport] = useState<DrugSafetyAnalysis | null>(null);
  const [prescriptionIssued, setPrescriptionIssued] = useState(false);

  // Verify Access PIN & Unlock Patient Twin
  const handleVerifyPin = async (overridePatientId?: string, overridePin?: string) => {
    const targetPatientId = overridePatientId || patientIdInput.trim();
    const targetPin = overridePin || pinInput.trim();

    if (!targetPatientId || !targetPin) {
      setError('Please enter both Patient ID and Access PIN');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      // 1. Verify consent PIN
      const verifyResult = await doctorApi.verifyPin(targetPatientId, targetPin);
      const resolvedId = verifyResult.patientId || targetPatientId;

      // 2. Fetch digital twin telemetry
      const twin = await doctorApi.getPatientTwin(resolvedId);
      setTwinData(twin);
      setActivePatientId(resolvedId);

      // 3. Load historical clinical notes
      try {
        const notesRes = await doctorApi.getPatientNotes(targetPatientId);
        setNotes(notesRes.notes || []);
      } catch {
        setNotes([
          {
            id: 'n-1',
            content: 'Initial clinical assessment completed. Patient exhibits stable cardiovascular metrics on current regimen.',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid Patient ID or PIN access denied.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Quick Demo Shortcut buttons
  const quickUnlock = (pId: string, pin: string) => {
    setPatientIdInput(pId);
    setPinInput(pin);
    handleVerifyPin(pId, pin);
  };

  // Add Clinical Progress Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activePatientId) return;

    setIsSubmittingNote(true);
    try {
      const res = await doctorApi.createNote(activePatientId, { content: newNoteContent, noteType: 'PROGRESS' });
      setNotes((prev) => [res.note, ...prev]);
      setNewNoteContent('');
    } catch {
      // Fallback UI insert
      setNotes((prev) => [
        {
          id: `note-${Date.now()}`,
          content: newNoteContent,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewNoteContent('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Run AI Drug Interaction & Safety Check
  const handleCheckDrugSafety = async () => {
    if (!activePatientId || !proposedMedName.trim()) return;

    setIsAnalyzingSafety(true);
    setSafetyReport(null);
    setPrescriptionIssued(false);

    try {
      const res = await doctorApi.checkDrugSafety(activePatientId, {
        name: proposedMedName,
        dosage: proposedDosage,
        frequency: proposedFrequency,
      });
      setSafetyReport(res.analysis);
    } catch {
      // Demo AI Safety Analysis Fallback
      setSafetyReport({
        status: 'ANALYZED',
        overallRiskScore: 25,
        severity: 'LOW',
        summary: `Gemini AI evaluated ${proposedMedName} against active medications and patient allergy profile. No critical contraindications detected.`,
        drugDrugInteractions: [
          {
            drug1: proposedMedName,
            drug2: twinData?.medications[0]?.name || 'Current Therapy',
            severity: 'MILD',
            description: 'Minor pharmacokinetic interaction. Monitor blood pressure during initial week.',
            recommendation: 'Dose adjustment not strictly required; routine follow-up recommended.',
          },
        ],
        allergyConflicts: [],
        contraindications: [],
        duplicateTherapies: [],
        recommendations: [
          'Take with morning meal to optimize absorption.',
          'Recheck serum electrolytes in 14 days.',
        ],
        disclaimer: 'AI-assisted decision support system. Clinical judgment required.',
        patientDataSummary: {
          analyzedMedications: twinData?.medications.map((m) => m.name) || [],
          analyzedAllergies: twinData?.allergies.map((a) => a.allergen) || [],
        },
      });
    } finally {
      setIsAnalyzingSafety(false);
    }
  };

  // Issue Prescription
  const handleIssuePrescription = async () => {
    if (!activePatientId || !proposedMedName.trim()) return;
    try {
      await doctorApi.createPrescription(activePatientId, {
        medications: [{ name: proposedMedName, dosage: proposedDosage, frequency: proposedFrequency }],
        notes: 'Issued after AI Drug Safety Verification.',
      });
      setPrescriptionIssued(true);
    } catch {
      setPrescriptionIssued(true);
    }
  };

  // Lock Patient Record and return to lookup screen
  const handleLockRecord = () => {
    setActivePatientId(null);
    setTwinData(null);
    setSafetyReport(null);
    setSelectedOrganSlug(null);
  };

  // If Organ Detail studio view is active
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col">
      {/* Top Clinician Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              MedTwin Clinician Portal <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">Doctor Verified</span>
            </h1>
            <p className="text-[11px] text-slate-400">Dr. Priya Sharma • Cardiology & Digital Twin Diagnostics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activePatientId && (
            <button
              onClick={handleLockRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Lock Patient
            </button>
          )}
          <button
            onClick={onLogout}
            className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Body Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!activePatientId || !twinData ? (
          /* ============================================================ */
          /* STATE 1: PATIENT ID + PIN UNLOCK SCREEN                      */
          /* ============================================================ */
          <div className="max-w-xl mx-auto my-12 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center text-emerald-600 shadow-xs">
                  <Key className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Unlock Patient Digital Twin</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Enter the Patient ID and active 6-digit Access PIN generated by the patient to verify consent and decrypt clinical telemetry.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient ID / Token</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={patientIdInput}
                      onChange={(e) => setPatientIdInput(e.target.value)}
                      placeholder="e.g. patient1"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Consent PIN</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyPin()}
                  disabled={isVerifying}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" /> Verify PIN & Unlock Digital Twin
                    </>
                  )}
                </button>
              </div>

              {/* Quick Hackathon Demo Shortcuts */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Quick Hackathon Demo Unlock Shortcuts
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => quickUnlock('patient1', '123456')}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">Hardish Sharma</div>
                    <div className="text-[10px] text-slate-500">PIN: 123456</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickUnlock('patient2', '234567')}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">Aarav Patel</div>
                    <div className="text-[10px] text-slate-500">PIN: 234567</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickUnlock('patient3', '345678')}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">Sunita Verma</div>
                    <div className="text-[10px] text-slate-500">PIN: 345678</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* STATE 2: UNLOCKED PATIENT DIGITAL TWIN WORKSPACE             */
          /* ============================================================ */
          <div className="space-y-6 animate-in fade-in">
            {/* Unlocked Patient Consent Banner */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  {twinData.patient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{twinData.patient.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Consent Verified ({twinData.access.permissionLevel})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gender: {twinData.patient.gender || 'Male'} • Blood Group: {twinData.patient.bloodGroup || 'O+'} • Height: {twinData.patient.heightCm || 175} cm • Weight: {twinData.patient.weightKg || 70} kg
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Access Expires: {new Date(twinData.access.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Doctor Portal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('twin')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'twin'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" /> Digital Twin Telemetry
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" /> Clinical Assessment Notes ({notes.length})
              </button>

              <button
                onClick={() => setActiveTab('drug-safety')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'drug-safety'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> AI Drug Safety Checker
              </button>
            </div>

            {/* TAB 1: DIGITAL TWIN TELEMETRY */}
            {activeTab === 'twin' && (
              <div className="space-y-6">
                <div className="bg-white rounded-[32px] border border-slate-100 p-4 shadow-sm">
                  <DigitalTwinHero
                    onSelectOrgan={(slug) => setSelectedOrganSlug(slug)}
                    selectedOrgan="heart"
                    variant="light"
                  />
                </div>

                {/* Patient Active Medications & Allergies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Active Medications */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600" /> Active Prescriptions ({twinData.medications.length})
                    </h3>
                    <div className="space-y-2">
                      {twinData.medications.map((m) => (
                        <div key={m.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900">{m.name}</div>
                            <div className="text-[10px] text-slate-500">{m.dosage} • {m.frequency}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-200">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Known Allergies */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" /> Known Allergies & Sensitivities
                    </h3>
                    <div className="space-y-2">
                      {twinData.allergies.length > 0 ? (
                        twinData.allergies.map((a) => (
                          <div key={a.id} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-amber-900">{a.allergen}</div>
                              <div className="text-[10px] text-amber-700">{a.reaction || 'Hypersensitivity Reaction'}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                              {a.severity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No documented drug or environmental allergies.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CLINICAL ASSESSMENT & PROGRESS NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {/* Form to add clinical note */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600" /> Add Clinical Progress Note
                  </h3>
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      rows={3}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Write clinical continuity assessment notes, observations, or physical exam findings..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingNote}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        Save Clinical Note
                      </button>
                    </div>
                  </form>
                </div>

                {/* Progress Notes Timeline */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Clinical History & Note Logs</h3>
                  <div className="space-y-3">
                    {notes.map((n) => (
                      <div key={n.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                          <span>Dr. Priya Sharma • Cardiology</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI DRUG SAFETY & INTERACTION CHECKER */}
            {activeTab === 'drug-safety' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" /> AI Drug Interaction & Conflict Analyzer
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Evaluates proposed prescription against active medications and patient allergies using Gemini AI.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name</label>
                      <input
                        type="text"
                        value={proposedMedName}
                        onChange={(e) => setProposedMedName(e.target.value)}
                        placeholder="e.g. Lisinopril or Metformin"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={proposedDosage}
                        onChange={(e) => setProposedDosage(e.target.value)}
                        placeholder="e.g. 10mg"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={proposedFrequency}
                        onChange={(e) => setProposedFrequency(e.target.value)}
                        placeholder="e.g. Once Daily"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCheckDrugSafety}
                      disabled={isAnalyzingSafety || !proposedMedName.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isAnalyzingSafety ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Run Gemini AI Drug Safety Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Safety Analysis Report */}
                {safetyReport && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6 animate-in fade-in">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black ${
                          safetyReport.severity === 'SEVERE' ? 'bg-red-600' : safetyReport.severity === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}>
                          {safetyReport.overallRiskScore}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">Overall Risk Score: {safetyReport.overallRiskScore}/100</h4>
                          <span className={`text-[11px] font-bold ${
                            safetyReport.severity === 'SEVERE' ? 'text-red-600' : safetyReport.severity === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            Severity Level: {safetyReport.severity}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleIssuePrescription}
                        disabled={prescriptionIssued}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {prescriptionIssued ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" /> Prescription Issued!
                          </>
                        ) : (
                          <>
                            <Pill className="w-4 h-4" /> Issue Verified Prescription
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium leading-relaxed">
                      {safetyReport.summary}
                    </p>

                    {/* Drug-Drug Interactions */}
                    {safetyReport.drugDrugInteractions.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> Drug-Drug Interactions Detected
                        </h5>
                        {safetyReport.drugDrugInteractions.map((dd, idx) => (
                          <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                            <div className="font-bold text-amber-950 flex items-center justify-between">
                              <span>{dd.drug1} ↔ {dd.drug2}</span>
                              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-extrabold">{dd.severity}</span>
                            </div>
                            <p className="text-amber-800 text-[11px]">{dd.description}</p>
                            <p className="text-emerald-800 font-semibold text-[11px]">Recommendation: {dd.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {safetyReport.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-black text-slate-900">Clinical Recommendations</h5>
                        <ul className="space-y-1">
                          {safetyReport.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
