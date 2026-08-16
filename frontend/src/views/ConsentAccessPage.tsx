import React, { useState, useEffect } from 'react';
import { patientApi } from '../services/patient.api';
import { ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { BackendConsent } from '../services/patient.api';

const EXPIRY_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
  { label: '7 days', value: 10080 },
];

export const ConsentAccessPage: React.FC = () => {
  const { user } = useAuth();
  const [consents, setConsents] = useState<BackendConsent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);

  // Create form
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [permissionLevel, setPermissionLevel] = useState<'BASIC' | 'FULL'>('FULL');

  // Shown-once PIN
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [pinConsentId, setPinConsentId] = useState<string | null>(null);

  const loadConsents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await patientApi.getConsents();
      setConsents(result.consents);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load consents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadConsents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError('');
    try {
      const result = await patientApi.createConsent({ expiresInMinutes, permissionLevel });
      setGeneratedPin(result.pin);
      setPinConsentId(user?.id || (result as any).patientId || result.consentId);
      setIsCreateOpen(false);
      loadConsents();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to generate consent PIN.');
    } finally {
      setCreating(false); }
  };

  const handleRevoke = async (consentId: string) => {
    setRevoking(consentId);
    try {
      await patientApi.revokeConsent(consentId);
      loadConsents();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to revoke consent.');
    } finally {
      setRevoking(null);
    }
  };

  const isExpired = (consent: BackendConsent) =>
    consent.status === 'EXPIRED' || new Date(consent.expiresAt) < new Date();

  const statusLabel = (c: BackendConsent): { label: string; color: string } => {
    if (c.status === 'REVOKED') return { label: 'Revoked', color: 'bg-slate-100 text-slate-500' };
    if (isExpired(c)) return { label: 'Expired', color: 'bg-amber-50 text-amber-600' };
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-600' };
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consent & Data Sharing Access</h1>
          <p className="text-xs text-slate-500 mt-0.5">Cryptographically signed patient permissions and 6-digit PIN authorizations</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all">
          <span className="material-symbols-outlined text-[18px]">add_moderator</span>Grant New Access
        </button>
      </div>

      {/* One-time PIN Display */}
      {generatedPin && (
        <div className="mt-5 p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white border border-blue-400/30 shadow-xl shadow-blue-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">lock</span>
              <span className="font-bold text-sm">Doctor Access PIN</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">SHOWN ONCE ONLY</span>
            </div>
            <button onClick={() => { setGeneratedPin(null); setPinConsentId(null); }} className="text-white/70 hover:text-white">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="flex items-center gap-3 justify-center py-3">
            {generatedPin.split('').map((digit, i) => (
              <div key={i} className="w-12 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black border border-white/30">
                {digit}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/80 text-center">
            Share this 6-digit PIN with your doctor. They will enter it on the Doctor Portal along with your Patient ID: <span className="font-mono font-bold">{pinConsentId}</span>
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-rose-400 text-[48px]">cloud_off</span>
          <p className="text-slate-800 font-bold">Failed to Load Consents</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={loadConsents} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Retry</button>
        </div>
      )}

      {!isLoading && !error && consents.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px]">admin_panel_settings</span>
          <p className="text-slate-700 font-bold">No Consent Records</p>
          <p className="text-slate-500 text-sm">Generate a PIN to grant a doctor access to your Digital Twin.</p>
          <button onClick={() => setIsCreateOpen(true)} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Grant Access</button>
        </div>
      )}

      {!isLoading && !error && consents.length > 0 && (
        <div className="flex flex-col gap-4 my-6">
          {consents.map((item) => {
            const { label, color } = statusLabel(item);
            const isActive = item.status === 'ACTIVE' && !isExpired(item);
            return (
              <div key={item.id}
                className="group bg-white rounded-3xl p-5 md:p-6 border border-slate-100/90 shadow-2xs hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[24px]">{isActive ? 'verified_user' : 'gpp_bad'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">Consent #{item.id.slice(-6)}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{item.permissionLevel}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Created: {new Date(item.createdAt).toLocaleString()} •
                      Expires: {new Date(item.expiresAt).toLocaleString()}
                    </p>
                    {item.lastVerifiedAt && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Last verified: {new Date(item.lastVerifiedAt).toLocaleString()}
                      </p>
                    )}
                    {item.failedAttempts > 0 && (
                      <p className="text-[11px] text-amber-500 mt-0.5">{item.failedAttempts} failed PIN attempt(s)</p>
                    )}
                  </div>
                </div>
                {isActive && (
                  <button onClick={() => handleRevoke(item.id)} disabled={revoking === item.id}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1">
                    {revoking === item.id ? <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /> : null}
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Consent Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900">Generate Doctor PIN</h3>
              <button onClick={() => { setIsCreateOpen(false); setCreateError(''); }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {createError && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 mb-3">{createError}</p>}
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Access Duration</label>
                <select value={expiresInMinutes} onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  {EXPIRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-2">Permission Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BASIC', 'FULL'] as const).map((lvl) => (
                    <button key={lvl} type="button" onClick={() => setPermissionLevel(lvl)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${permissionLevel === lvl ? 'bg-blue-600/10 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {lvl}
                      <p className="text-[10px] font-normal mt-0.5 opacity-70">
                        {lvl === 'BASIC' ? 'Profile + Vitals' : 'Full access'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={creating}
                className="mt-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {creating ? 'Generating...' : 'Generate PIN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
