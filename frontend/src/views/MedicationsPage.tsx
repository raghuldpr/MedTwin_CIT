import React, { useState, useEffect } from 'react';
import { patientApi } from '../services/patient.api';
import { ApiError } from '../services/api';
import type { BackendMedication } from '../services/patient.api';

const ROUTE_LABELS: Record<string, string> = {
  ORAL: 'Oral', INTRAVENOUS: 'IV', TOPICAL: 'Topical', INHALATION: 'Inhaled',
  SUBCUTANEOUS: 'Subcutaneous', INTRAMUSCULAR: 'IM',
};

export const MedicationsPage: React.FC = () => {
  const [meds, setMeds] = useState<BackendMedication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('Once daily');
  const [medRoute, setMedRoute] = useState('ORAL');
  const [medInstructions, setMedInstructions] = useState('');

  const loadMeds = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await patientApi.getMedications();
      setMeds(result.medications);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load medications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadMeds(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !medDosage.trim()) { setAddError('Name and dosage are required.'); return; }
    setAdding(true); setAddError('');
    try {
      await patientApi.addMedication({ name: medName, dosage: medDosage, frequency: medFreq, route: medRoute, instructions: medInstructions || undefined });
      setIsAddOpen(false);
      setMedName(''); setMedDosage(''); setMedFreq('Once daily'); setMedRoute('ORAL'); setMedInstructions('');
      loadMeds();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to add medication.');
    } finally { setAdding(false); }
  };

  const displayed = activeTab === 'active' ? meds.filter((m) => m.active) : meds;

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your prescription and supplement management center</p>
        </div>
        <button onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span>Add Medication
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mt-5 self-start">
        {(['active', 'all'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${tab === activeTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab === 'active' ? 'Active' : 'All Medications'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading medications...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-rose-400 text-[48px]">cloud_off</span>
          <p className="text-slate-800 font-bold">Failed to Load Medications</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={loadMeds} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Retry</button>
        </div>
      )}

      {!isLoading && !error && displayed.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px]">medication</span>
          <p className="text-slate-700 font-bold">{activeTab === 'active' ? 'No active medications' : 'No medications recorded'}</p>
          <p className="text-slate-500 text-sm">Add your first medication to begin tracking.</p>
          <button onClick={() => setIsAddOpen(true)} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Add Medication</button>
        </div>
      )}

      {!isLoading && !error && displayed.length > 0 && (
        <div className="flex flex-col gap-4 my-6">
          {displayed.map((med) => (
            <div key={med.id}
              className="group bg-white rounded-3xl p-5 md:p-6 border border-slate-100/90 shadow-2xs hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 ${med.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <span className="material-symbols-outlined text-[24px]">medication</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">{med.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${med.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {med.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{med.dosage} • {med.frequency} • {ROUTE_LABELS[med.route ?? 'ORAL'] ?? med.route}</p>
                  {med.instructions && <p className="text-[11px] text-slate-400 mt-1">{med.instructions}</p>}
                  {med.startDate && <p className="text-[11px] text-slate-400 mt-0.5">Started: {new Date(med.startDate).toLocaleDateString()}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900">Add Medication</h3>
              <button onClick={() => { setIsAddOpen(false); setAddError(''); }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {addError && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 mb-3">{addError}</p>}
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              {[
                ['Medication Name *', medName, setMedName, 'text', 'e.g. Amlodipine'],
                ['Dosage *', medDosage, setMedDosage, 'text', 'e.g. 5mg'],
              ].map(([label, val, setter, type, placeholder]) => (
                <div key={String(label)}>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{label}</label>
                  <input type={type as string} value={val as string} onChange={(e) => (setter as Function)(e.target.value)} placeholder={placeholder as string} required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Frequency</label>
                <select value={medFreq} onChange={(e) => setMedFreq(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  {['Once daily', 'Twice daily', 'Three times daily', 'Once weekly', 'As needed'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Route</label>
                <select value={medRoute} onChange={(e) => setMedRoute(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  {Object.entries(ROUTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Instructions</label>
                <input type="text" value={medInstructions} onChange={(e) => setMedInstructions(e.target.value)} placeholder="e.g. Take with food"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <button type="submit" disabled={adding}
                className="mt-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {adding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {adding ? 'Adding...' : 'Add Medication'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
