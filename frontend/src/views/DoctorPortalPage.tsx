import React, { useState } from 'react';
import { doctorApi, PatientTwinData, DrugSafetyAnalysis } from '../services/doctor.api';
import { ApiError } from '../services/api';

export const DoctorPortalPage: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Verified twin state
  const [twin, setTwin] = useState<PatientTwinData | null>(null);
  const [loadingTwin, setLoadingTwin] = useState(false);
  const [twinError, setTwinError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'meds' | 'safety' | 'notes'>('overview');

  // Clinical Note form
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState('');

  // Drug Safety state
  const [proposedMed, setProposedMed] = useState('');
  const [safetyAnalysis, setSafetyAnalysis] = useState<DrugSafetyAnalysis | null>(null);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyError, setSafetyError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim() || !pin.trim()) { setVerifyError('Patient ID and PIN are required.'); return; }
    setVerifying(true); setVerifyError(''); setTwin(null);
    try {
      await doctorApi.verifyPin(patientId.trim(), pin.trim());
      await loadTwin(patientId.trim());
    } catch (err) {
      setVerifyError(err instanceof ApiError ? err.message : 'PIN verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const loadTwin = async (id: string) => {
    setLoadingTwin(true); setTwinError('');
    try {
      const data = await doctorApi.getPatientTwin(id);
      setTwin(data);
    } catch (err) {
      setTwinError(err instanceof ApiError ? err.message : 'Failed to load patient Digital Twin.');
    } finally {
      setLoadingTwin(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !patientId) return;
    setSavingNote(true); setNoteSuccess('');
    try {
      await doctorApi.createNote(patientId, { content: noteContent });
      setNoteContent('');
      setNoteSuccess('Clinical note saved successfully.');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRunSafetyCheck = async () => {
    if (!patientId) return;
    setCheckingSafety(true); setSafetyError(''); setSafetyAnalysis(null);
    try {
      const res = await doctorApi.checkDrugSafety(
        patientId,
        proposedMed ? { name: proposedMed } : undefined
      );
      setSafetyAnalysis(res.analysis);
    } catch (err) {
      setSafetyError(err instanceof ApiError ? err.message : 'Drug safety analysis unavailable.');
    } finally {
      setCheckingSafety(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400 text-[28px]">stethoscope</span>
            Doctor Clinical Portal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Patient Digital Twin Authorization & Clinical Decision Support System
          </p>
        </div>
      </div>

      {/* Verification Step */}
      {!twin && (
        <div className="max-w-md mx-auto w-full bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl mt-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">key</span>
            </div>
            <h2 className="text-lg font-bold text-white">Enter Patient PIN Consent</h2>
            <p className="text-xs text-slate-400 mt-1">
              Ask the patient for their Patient User ID and active 6-digit access PIN.
            </p>
          </div>

          {verifyError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {verifyError}
            </div>
          )}

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Patient ID</label>
              <input
                type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)}
                placeholder="Paste Patient User ID" required
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">6-Digit PIN</label>
              <input
                type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)}
                placeholder="123456" required
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>

            <button type="submit" disabled={verifying}
              className="mt-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {verifying && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {verifying ? 'Verifying Authorization...' : 'Verify Access PIN'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-4">
            For testing: Login as patient → Go to Consent → Generate PIN → Copy Patient ID
          </p>
        </div>
      )}

      {/* Authorized Digital Twin Workspace */}
      {twin && (
        <div className="flex flex-col gap-6">
          {/* Patient Banner */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-500/20">
                {twin.patient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{twin.patient.name}</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${twin.access.permissionLevel === 'FULL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {twin.access.permissionLevel} ACCESS
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {twin.patient.id} • Gender: {twin.patient.gender || '—'} • Blood: {twin.patient.bloodGroup || '—'}
                </p>
              </div>
            </div>
            <button onClick={() => setTwin(null)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all self-start md:self-auto">
              Close Patient Session
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 self-start">
            {(['overview', 'vitals', 'meds', 'safety', 'notes'] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === t ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white'}`}>
                {t === 'safety' ? 'Drug Safety AI' : t}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Organ System Telemetry</h3>
                <div className="flex flex-col gap-2">
                  {twin.organs.length === 0 ? (
                    <p className="text-xs text-slate-500">No organ data recorded.</p>
                  ) : twin.organs.map((o) => (
                    <div key={o.id} className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 capitalize">{o.system.toLowerCase()}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${o.status === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {o.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Known Allergies</h3>
                <div className="flex flex-col gap-2">
                  {twin.allergies.length === 0 ? (
                    <p className="text-xs text-slate-500">No recorded allergies.</p>
                  ) : twin.allergies.map((a) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                      <span className="font-bold text-rose-300">{a.allergen}</span>
                      <span className="text-slate-400 ml-2">({a.severity})</span>
                      {a.reaction && <p className="text-[11px] text-slate-400 mt-0.5">{a.reaction}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Vitals Telemetry Log</h3>
              {twin.vitals.length === 0 ? (
                <p className="text-xs text-slate-500">No vitals logged for patient.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-slate-500 border-b border-white/10">
                      <tr>
                        <th className="pb-2">Timestamp</th>
                        <th className="pb-2">Heart Rate</th>
                        <th className="pb-2">Blood Pressure</th>
                        <th className="pb-2">SpO₂</th>
                        <th className="pb-2">Glucose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {twin.vitals.map((v) => (
                        <tr key={v.id}>
                          <td className="py-2.5">{new Date(v.recordedAt).toLocaleString()}</td>
                          <td>{v.heartRate ? `${v.heartRate} bpm` : '—'}</td>
                          <td>{v.systolicBP ? `${v.systolicBP}/${v.diastolicBP}` : '—'}</td>
                          <td>{v.spo2 ? `${v.spo2}%` : '—'}</td>
                          <td>{v.bloodGlucose ? `${v.bloodGlucose} mg/dL` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'meds' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Active Medications</h3>
              {twin.medications.length === 0 ? (
                <p className="text-xs text-slate-500">No active medications.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {twin.medications.map((m) => (
                    <div key={m.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                      <p className="font-bold text-teal-300 text-sm">{m.name}</p>
                      <p className="text-slate-400">{m.dosage} • {m.frequency}</p>
                      {m.instructions && <p className="text-slate-500 mt-1">{m.instructions}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">AI Drug Safety Analyzer (Gemini Powered)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cross-analyzes current medications, allergies, and proposed prescriptions.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text" value={proposedMed} onChange={(e) => setProposedMed(e.target.value)}
                  placeholder="Proposed medication (e.g. Lisinopril 10mg)"
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none"
                />
                <button onClick={handleRunSafetyCheck} disabled={checkingSafety}
                  className="px-5 py-2 rounded-xl bg-teal-500 text-white font-semibold text-xs hover:bg-teal-600 disabled:opacity-50 flex items-center gap-2">
                  {checkingSafety && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {checkingSafety ? 'Analyzing...' : 'Run Safety Check'}
                </button>
              </div>

              {safetyError && <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{safetyError}</p>}

              {safetyAnalysis && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-400">Risk Score: {safetyAnalysis.overallRiskScore}/100</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold uppercase">{safetyAnalysis.severity}</span>
                  </div>
                  <p className="text-slate-300">{safetyAnalysis.summary}</p>
                  {safetyAnalysis.recommendations?.length > 0 && (
                    <div>
                      <p className="font-semibold text-slate-400 mb-1">Clinical Recommendations:</p>
                      <ul className="list-disc list-inside text-slate-400 space-y-1">
                        {safetyAnalysis.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white">Add Clinical Consultation Note</h3>
              {noteSuccess && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{noteSuccess}</p>}
              <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                <textarea
                  value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={4}
                  placeholder="Enter clinical assessment, diagnostic impression, or treatment plan notes..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none"
                />
                <button type="submit" disabled={savingNote}
                  className="self-end px-5 py-2 rounded-xl bg-teal-500 text-white font-semibold text-xs hover:bg-teal-600 disabled:opacity-50 flex items-center gap-2">
                  {savingNote && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Clinical Note
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
