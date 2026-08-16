import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, register, isAuthenticated, isLoading, backendOnline, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Redirect after authentication based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Full name is required.'); setSubmitting(false); return; }
        await register(name, email, password, role);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (type: 'patient' | 'doctor' | 'admin') => {
    setTab('login');
    const creds: Record<string, string> = {
      patient: 'patient@medtwin.test',
      doctor: 'doctor@medtwin.test',
      admin: 'admin@medtwin.test',
    };
    setEmail(creds[type]);
    setPassword('Patient123!'.replace('Patient', type.charAt(0).toUpperCase() + type.slice(1)));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Initializing MedTwin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo / Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="material-symbols-outlined text-white text-[22px]">biotech</span>
            </div>
            <span className="text-2xl font-black text-white tracking-tight">MedTwin</span>
          </div>
          <p className="text-slate-400 text-sm">Clinical Patient Digital Twin Platform</p>
        </div>

        {/* Backend offline banner */}
        {!backendOnline && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs font-medium">
            <span className="material-symbols-outlined text-[18px] shrink-0">wifi_off</span>
            Backend server is offline. Please start the backend on port 3001.
          </div>
        )}

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                  tab === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name" required autoComplete="name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? 'Min. 8 characters' : 'Your password'} required
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PATIENT', 'DOCTOR'] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        role === r ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {r === 'PATIENT' ? 'person' : 'stethoscope'}
                      </span>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting || !backendOnline}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {tab === 'login' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">{tab === 'login' ? 'login' : 'person_add'}</span> {tab === 'login' ? 'Sign In' : 'Create Account'}</>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] text-slate-500 text-center mb-3 font-semibold uppercase tracking-wider">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {(['patient', 'doctor', 'admin'] as const).map((type) => (
                <button key={type} onClick={() => fillDemo(type)}
                  className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white text-[11px] font-semibold transition-all capitalize flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    {type === 'patient' ? 'person' : type === 'doctor' ? 'stethoscope' : 'admin_panel_settings'}
                  </span>
                  {type}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-2">Run seed script to create demo accounts first</p>
          </div>
        </div>
      </div>
    </div>
  );
};
