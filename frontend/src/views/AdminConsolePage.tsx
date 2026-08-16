import React, { useState, useEffect } from 'react';
import { adminApi, AdminUser, AuditLogEntry, ComplianceSummary } from '../services/admin.api';
import { ApiError } from '../services/api';

export const AdminConsolePage: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'doctors' | 'audit' | 'compliance'>('compliance');

  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true); setError('');
    try {
      const [uRes, lRes, cRes] = await Promise.all([
        adminApi.getUsers({ limit: 50 }),
        adminApi.getAuditLogs({ limit: 50 }),
        adminApi.getComplianceSummary(),
      ]);
      setUsers(uRes.users);
      setLogs(lRes.logs);
      setCompliance(cRes.summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load admin console data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleUserStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update user status.');
    }
  };

  const handleVerifyDoctor = async (doctorId: string, status: string) => {
    try {
      await adminApi.updateDoctorVerification(doctorId, status);
      loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update doctor verification.');
    }
  };

  const doctorsList = users.filter((u) => u.role === 'DOCTOR');

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-[28px]">admin_panel_settings</span>
            MedTwin Governance & Compliance Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">System administration, user lifecycle, audit trail & security compliance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 self-start">
        {(['compliance', 'users', 'doctors', 'audit'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}>
            {t === 'doctors' ? 'Doctor Verification' : t === 'audit' ? 'Audit Logs' : t}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {tab === 'compliance' && compliance && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Total Registered Users</span>
                <span className="text-3xl font-black text-white">{compliance.totalUsers}</span>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Patients</span>
                <span className="text-3xl font-black text-blue-400">{compliance.totalPatients}</span>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Doctors</span>
                <span className="text-3xl font-black text-teal-400">{compliance.totalDoctors}</span>
                <p className="text-[10px] text-slate-500 mt-1">{compliance.verifiedDoctors} verified</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Audit Log Entries</span>
                <span className="text-3xl font-black text-purple-400">{compliance.totalAuditLogs}</span>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Registered Platform Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-slate-500 border-b border-white/10">
                    <tr>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5 font-semibold text-white">{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'PATIENT' ? 'bg-blue-500/20 text-blue-400' : u.role === 'DOCTOR' ? 'bg-teal-500/20 text-teal-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <button onClick={() => handleToggleUserStatus(u)}
                            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] text-white transition-all">
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'doctors' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Doctor Credentials & Verifications</h3>
              {doctorsList.length === 0 ? (
                <p className="text-xs text-slate-500">No doctor accounts found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {doctorsList.map((d) => (
                    <div key={d.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{d.name}</p>
                        <p className="text-slate-400">{d.email}</p>
                        <p className="text-slate-500 mt-1">Status: {d.doctorVerification?.verificationStatus || 'UNVERIFIED'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleVerifyDoctor(d.id, 'VERIFIED')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-all">
                          Verify
                        </button>
                        <button onClick={() => handleVerifyDoctor(d.id, 'REJECTED')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs hover:bg-rose-500/30 transition-all">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'audit' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">System Security Audit Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-slate-500 border-b border-white/10">
                    <tr>
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Actor</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Resource</th>
                      <th className="pb-2">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2">{new Date(l.createdAt).toLocaleString()}</td>
                        <td>{l.actorRole}</td>
                        <td className="font-mono text-purple-300">{l.action}</td>
                        <td>{l.resourceType}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.outcome === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {l.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
