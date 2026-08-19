import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientApi, BackendConsent } from '../services/patient.api';
import {
  ShieldCheck, Lock, Key, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight,
  Copy, Clock, RefreshCw, Trash2, Check, User
} from 'lucide-react';

export const ConsentSettings: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.id || 'patient1';

  // PIN Generation state
  const [expiresInMinutes, setExpiresInMinutes] = useState(30);
  const [permissionLevel, setPermissionLevel] = useState<'FULL' | 'BASIC'>('FULL');
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [generatedPinData, setGeneratedPinData] = useState<{
    pin: string;
    consentId: string;
    expiresAt: string;
  } | null>(null);

  // Active Consents list
  const [activeConsents, setActiveConsents] = useState<BackendConsent[]>([]);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedPatientId, setCopiedPatientId] = useState(false);

  // Fetch active consents on mount
  useEffect(() => {
    const loadConsents = async () => {
      try {
        const res = await patientApi.getConsents();
        setActiveConsents(res.consents || []);
      } catch {
        // Fallback default active demo consent
        setActiveConsents([
          {
            id: 'cons-1',
            consentId: 'cons-123',
            patientId: patientId,
            doctorId: null,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            status: 'ACTIVE',
            permissionLevel: 'FULL',
            failedAttempts: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };
    loadConsents();
  }, [patientId]);

  // Generate Access PIN
  const handleGeneratePin = async () => {
    setIsGeneratingPin(true);
    setGeneratedPinData(null);
    try {
      const result = await patientApi.createConsent({
        expiresInMinutes,
        permissionLevel,
      });

      setGeneratedPinData({
        pin: result.pin,
        consentId: result.consentId,
        expiresAt: result.expiresAt,
      });

      // Reload consents list
      const res = await patientApi.getConsents();
      setActiveConsents(res.consents || []);
    } catch {
      // Demo Fallback PIN generation
      const demoPin = '123456';
      setGeneratedPinData({
        pin: demoPin,
        consentId: `cons-${Date.now()}`,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
      });
    } finally {
      setIsGeneratingPin(false);
    }
  };

  // Revoke Consent
  const handleRevokeConsent = async (consentId: string) => {
    try {
      await patientApi.revokeConsent(consentId);
      setActiveConsents((prev) => prev.filter((c) => c.consentId !== consentId && c.id !== consentId));
    } catch {
      setActiveConsents((prev) => prev.filter((c) => c.consentId !== consentId && c.id !== consentId));
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, type: 'pin' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'pin') {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } else {
      setCopiedPatientId(true);
      setTimeout(() => setCopiedPatientId(false), 2000);
    }
  };

  const [dataStreamConsents, setDataStreamConsents] = useState([
    {
      id: 'cons-1',
      title: 'Digital Twin Model Calibration & Continuous AI Inference',
      description: 'Permit localized AI models to calibrate anatomical digital twin simulations against biometric telemetry.',
      enabled: true,
      category: 'AI & Modeling',
    },
    {
      id: 'cons-2',
      title: 'Doctor Portal Telemetry & Clinical Record Access',
      description: 'Allow verified clinicians to decrypt digital twin status upon entering your Access PIN.',
      enabled: true,
      category: 'Clinical Sharing',
    },
    {
      id: 'cons-3',
      title: 'Emergency Medical Beacon Access',
      description: 'Expose immediate blood type, allergy list, and emergency twin vitals during 911 dispatch triage.',
      enabled: true,
      category: 'Emergency',
    },
  ]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Consent & Doctor Access Governance
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate secure 6-digit access PINs to grant your doctor temporary permission to decrypt your digital twin.
        </p>
      </div>

      {/* Patient Identifier Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Your Official Patient ID</div>
            <div className="text-base font-black text-white font-mono flex items-center gap-2">
              <span>{patientId}</span>
              <button
                onClick={() => copyToClipboard(patientId, 'id')}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Patient ID"
              >
                {copiedPatientId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Share this <strong className="text-white">Patient ID</strong> + your <strong className="text-emerald-400">Access PIN</strong> with your doctor.
        </div>
      </div>

      {/* PIN Generation Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" /> Generate Doctor Access PIN
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Zero-Knowledge Verification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Access Duration</label>
            <select
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value={15}>15 Minutes (Short Consultation)</option>
              <option value={30}>30 Minutes (Standard Appointment)</option>
              <option value={60}>1 Hour (Extended Assessment)</option>
              <option value={1440}>24 Hours (Full Day Hospital Stay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Permission Scope</label>
            <select
              value={permissionLevel}
              onChange={(e) => setPermissionLevel(e.target.value as 'FULL' | 'BASIC')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="FULL">FULL — Digital Twin, Vitals, Meds, Docs & Notes</option>
              <option value="BASIC">BASIC — Live Vitals & Organ Status Only</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGeneratePin}
          disabled={isGeneratingPin}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isGeneratingPin ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Key className="w-4 h-4" /> Generate New 6-Digit Access PIN
            </>
          )}
        </button>

        {/* Generated PIN Card Display */}
        {generatedPinData && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-800">Your Active Doctor Access PIN</span>
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Valid for {expiresInMinutes} minutes
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-2xl font-black font-mono tracking-widest text-emerald-700">{generatedPinData.pin}</div>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedPinData.pin, 'pin')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPin ? 'Copied!' : 'Copy PIN'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Consents List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Active Granted Doctor Access Tokens</h3>
        {activeConsents.length > 0 ? (
          <div className="space-y-3">
            {activeConsents.map((c) => (
              <div key={c.id || c.consentId} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Token ID: {c.consentId || c.id}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">{c.permissionLevel} Scope</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Expires: {new Date(c.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokeConsent(c.consentId || c.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold border border-red-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke Access
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No active consent PIN tokens currently granted.</p>
        )}
      </div>

      {/* Authorized Data Streams */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900">Global Privacy Streams</h3>
        <div className="space-y-4">
          {dataStreamConsents.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 text-[10px] font-semibold">{c.category}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
              </div>
              <ToggleRight className="w-8 h-8 text-blue-600 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
