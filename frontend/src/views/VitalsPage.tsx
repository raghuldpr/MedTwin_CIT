import React, { useState, useEffect } from 'react';
import { MedicalWaveform } from '../components/MedicalWaveform';
import { patientApi } from '../services/patient.api';
import { ApiError } from '../services/api';
import type { BackendVital } from '../services/patient.api';

type WaveformType = 'ecg' | 'bp' | 'spo2' | 'glucose';

interface VitalCard {
  key: keyof BackendVital;
  label: string;
  unit: string;
  icon: string;
  color: string;
  strokeColor: string;
  waveform: WaveformType;
  normalRange: string;
}

const VITAL_CARDS: VitalCard[] = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: 'favorite', color: 'bg-rose-50 text-rose-500', strokeColor: '#f43f5e', waveform: 'ecg', normalRange: '60–100 bpm' },
  { key: 'systolicBP', label: 'Blood Pressure', unit: 'mmHg', icon: 'water_drop', color: 'bg-blue-50 text-blue-500', strokeColor: '#3b82f6', waveform: 'bp', normalRange: '<120/80 mmHg' },
  { key: 'spo2', label: 'SpO₂', unit: '%', icon: 'air', color: 'bg-emerald-50 text-emerald-500', strokeColor: '#10b981', waveform: 'spo2', normalRange: '95–100%' },
  { key: 'bloodGlucose', label: 'Blood Glucose', unit: 'mg/dL', icon: 'bloodtype', color: 'bg-purple-50 text-purple-500', strokeColor: '#a855f7', waveform: 'glucose', normalRange: '70–100 mg/dL (fasting)' },
  { key: 'temperatureC', label: 'Temperature', unit: '°C', icon: 'device_thermostat', color: 'bg-amber-50 text-amber-500', strokeColor: '#f59e0b', waveform: 'ecg', normalRange: '36.1–37.2 °C' },
];

const getVitalValue = (vital: BackendVital, key: keyof BackendVital): string => {
  if (key === 'systolicBP') {
    return vital.systolicBP !== undefined && vital.diastolicBP !== undefined
      ? `${vital.systolicBP}/${vital.diastolicBP}`
      : '—';
  }
  const v = vital[key];
  if (v === undefined || v === null) return '—';
  return String(v);
};

const getStatusText = (vital: BackendVital): { text: string; color: string } => {
  const hr = vital.heartRate;
  const spo2 = vital.spo2;
  if (spo2 !== undefined && spo2 < 94) return { text: 'Low SpO₂ — Attention needed', color: 'text-rose-500' };
  if (hr !== undefined && (hr > 100 || hr < 60)) return { text: 'Heart rate outside normal range', color: 'text-amber-500' };
  return { text: 'Within normal clinical range', color: 'text-emerald-600' };
};

export const VitalsPage: React.FC = () => {
  const [vitals, setVitals] = useState<BackendVital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState<VitalCard>(VITAL_CARDS[0]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Add vital form
  const [hrInput, setHrInput] = useState('');
  const [sysBP, setSysBP] = useState('');
  const [diaBP, setDiaBP] = useState('');
  const [spo2Input, setSpo2] = useState('');
  const [glucoseInput, setGlucose] = useState('');
  const [tempInput, setTemp] = useState('');

  const loadVitals = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await patientApi.getVitals(1, 20);
      setVitals(result.vitals);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load vitals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadVitals(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      await patientApi.addVital({
        heartRate: hrInput ? Number(hrInput) : undefined,
        systolicBP: sysBP ? Number(sysBP) : undefined,
        diastolicBP: diaBP ? Number(diaBP) : undefined,
        spo2: spo2Input ? Number(spo2Input) : undefined,
        bloodGlucose: glucoseInput ? Number(glucoseInput) : undefined,
        temperatureC: tempInput ? Number(tempInput) : undefined,
        source: 'MANUAL',
      });
      setIsAddOpen(false);
      setHrInput(''); setSysBP(''); setDiaBP(''); setSpo2(''); setGlucose(''); setTemp('');
      loadVitals();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to record vitals.');
    } finally {
      setAdding(false);
    }
  };

  const latest = vitals[0];
  const status = latest ? getStatusText(latest) : null;

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Vitals & Telemetry</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time biometric monitoring feeds and diagnostic trend analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && !error && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {vitals.length} Records
            </span>
          )}
          <button onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all">
            <span className="material-symbols-outlined text-[16px]">add</span>Record Vitals
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading vitals from backend...</p>
          </div>
        </div>
      )}

      {/* Error state — no fake data shown */}
      {!isLoading && error && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-rose-400 text-[48px]">cloud_off</span>
          <p className="text-slate-800 font-bold">Failed to Load Vitals</p>
          <p className="text-slate-500 text-sm max-w-sm">{error}</p>
          <button onClick={loadVitals} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && vitals.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px]">monitor_heart</span>
          <p className="text-slate-700 font-bold">No Vitals Recorded Yet</p>
          <p className="text-slate-500 text-sm">Record your first vital signs to start tracking your health.</p>
          <button onClick={() => setIsAddOpen(true)} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
            Record Now
          </button>
        </div>
      )}

      {/* Vitals Grid */}
      {!isLoading && !error && vitals.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
            {VITAL_CARDS.map((card) => {
              const isSelected = selectedCard.key === card.key;
              const value = latest ? getVitalValue(latest, card.key) : '—';
              return (
                <div key={card.key} onClick={() => setSelectedCard(card)}
                  className={`group bg-white rounded-3xl p-5 border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10 -translate-y-0.5'
                      : 'border-slate-100 shadow-2xs hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 ${card.color}`}>
                        <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">{card.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {latest ? new Date(latest.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="my-3">
                    <span className="text-2xl font-black text-slate-900">{value}</span>{' '}
                    <span className="text-xs font-medium text-slate-500">{card.unit}</span>
                    {status && <p className={`text-[11px] font-semibold mt-0.5 ${status.color}`}>● {status.text}</p>}
                  </div>
                  <div className="pt-2 border-t border-slate-50">
                    <MedicalWaveform type={card.waveform} color={card.strokeColor} height={32} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedCard.label} — Diagnostic Waveform</h2>
                <p className="text-xs text-slate-400">Standard Clinical Range: <span className="font-semibold text-slate-700">{selectedCard.normalRange}</span></p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">
                  {latest ? getVitalValue(latest, selectedCard.key) : '—'}
                </span>{' '}
                <span className="text-xs text-slate-500">{selectedCard.unit}</span>
              </div>
            </div>
            <div className="w-full bg-slate-950 rounded-2xl p-4 relative overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                <span className="font-mono">CH-1 TELEMETRY • LIVE STREAM</span>
                <span className="text-emerald-400 font-mono">GAIN: 1.0x | 25 mm/s</span>
              </div>
              <div className="py-4">
                <MedicalWaveform type={selectedCard.waveform} color={selectedCard.strokeColor} height={80} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Vitals Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900">Record Vital Signs</h3>
              <button onClick={() => { setIsAddOpen(false); setAddError(''); }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {addError && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 mb-3">{addError}</p>}
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              {[
                ['Heart Rate (bpm)', hrInput, setHrInput],
                ['Temperature (°C)', tempInput, setTemp],
                ['Systolic BP', sysBP, setSysBP],
                ['Diastolic BP', diaBP, setDiaBP],
                ['SpO₂ (%)', spo2Input, setSpo2],
                ['Blood Glucose (mg/dL)', glucoseInput, setGlucose],
              ].map(([label, val, setter]) => (
                <div key={String(label)}>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{label}</label>
                  <input type="number" value={val as string} onChange={(e) => (setter as Function)(e.target.value)} step="any"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              ))}
              <button type="submit" disabled={adding}
                className="col-span-2 mt-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {adding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {adding ? 'Saving...' : 'Save Vitals'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
