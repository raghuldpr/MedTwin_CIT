import React, { useState } from 'react';
import { currentPatient } from '../data/mockData';

export const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'System'>('Light');
  const [aiTelemetry, setAiTelemetry] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [dataSharing, setDataSharing] = useState(true);

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-8 max-w-4xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings & Preferences</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure digital twin telemetry fidelity, theme preferences, and privacy controls
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Appearance Settings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">palette</span>
            Appearance & Interface Theme
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {(['Light', 'Dark', 'System'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                  theme === t
                    ? 'border-blue-500 bg-blue-50/60 text-blue-600 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t} Mode
              </button>
            ))}
          </div>
        </div>

        {/* Digital Twin AI & Telemetry */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">smart_toy</span>
            AI Telemetry & Analysis
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div>
              <p className="text-xs font-bold text-slate-800">Continuous AI Diagnostics</p>
              <p className="text-[11px] text-slate-400">
                Run automated real-time physiological anomaly detection across continuous sensor feeds
              </p>
            </div>
            <button
              onClick={() => setAiTelemetry(!aiTelemetry)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                aiTelemetry ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  aiTelemetry ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div>
              <p className="text-xs font-bold text-slate-800">Haptic 3D Feedback</p>
              <p className="text-[11px] text-slate-400">
                Simulate mechanical pulse vibration on mobile when inspecting cardiac nodes
              </p>
            </div>
            <button
              onClick={() => setHapticFeedback(!hapticFeedback)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                hapticFeedback ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Anonymized Telemetry Sharing</p>
              <p className="text-[11px] text-slate-400">
                Contribute de-identified vitals data to MedTwin Cardiovascular Bio-Intelligence research
              </p>
            </div>
            <button
              onClick={() => setDataSharing(!dataSharing)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                dataSharing ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  dataSharing ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Patient Credentials Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">badge</span>
            Patient Account
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div>Patient Name: <span className="font-bold text-slate-900">{currentPatient.name}</span></div>
            <div>Patient ID: <span className="font-bold text-slate-900">{currentPatient.patientId}</span></div>
            <div>Email: <span className="font-bold text-slate-900">{currentPatient.email}</span></div>
            <div>Phone: <span className="font-bold text-slate-900">{currentPatient.phone}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
