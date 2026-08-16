import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePatientData } from '../context/PatientDataContext';
import { patientApi } from '../services/patient.api';
import { ApiError } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { profile, reload } = usePatientData();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Editable fields (backed by backend profile)
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecRelationship, setEcRelationship] = useState('');
  const [ecPhone, setEcPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setGender(profile.gender ?? '');
      setBloodGroup(profile.bloodGroup ?? '');
      setHeightCm(profile.heightCm?.toString() ?? '');
      setWeightKg(profile.weightKg?.toString() ?? '');
      setEcName(profile.emergencyContact?.name ?? '');
      setEcRelationship(profile.emergencyContact?.relationship ?? '');
      setEcPhone(profile.emergencyContact?.phone ?? '');
    }
  }, [profile, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await patientApi.updateProfile({
        gender: gender || undefined,
        bloodGroup: bloodGroup || undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        emergencyContact: {
          name: ecName,
          relationship: ecRelationship,
          phone: ecPhone,
        },
      });
      setIsEditing(false);
      reload(); // Refresh global patient data
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  if (!isOpen) return null;

  const dobFormatted = profile?.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Patient Health Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Avatar & Patient ID */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-4 ring-blue-50 shadow-sm">
            <span className="text-white text-2xl font-black">{user?.name?.charAt(0)?.toUpperCase() ?? 'P'}</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{user?.name ?? '—'}</h3>
            <p className="text-xs text-blue-600 font-semibold">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              DOB: {dobFormatted} • {profile?.gender || '—'} • {profile?.bloodGroup || '—'}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {[
              ['Gender', profile?.gender || '—'],
              ['Blood Group', profile?.bloodGroup || '—'],
              ['Height', profile?.heightCm ? `${profile.heightCm} cm` : '—'],
              ['Weight', profile?.weightKg ? `${profile.weightKg} kg` : '—'],
              ['Emergency Contact', ecName || '—', true],
              ['EC Relationship', ecRelationship || '—'],
              ['EC Phone', ecPhone || '—'],
            ].map(([label, value, full]) => (
              <div key={String(label)} className={full ? 'sm:col-span-2' : ''}>
                <span className="text-slate-400 block">{label}</span>
                <span className="font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {saveError && (
              <p className="text-xs text-rose-600 bg-rose-50 rounded-xl p-3 border border-rose-100">{saveError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Gender', gender, setGender, 'e.g. Male'],
                ['Blood Group', bloodGroup, setBloodGroup, 'e.g. O+'],
                ['Height (cm)', heightCm, setHeightCm, '170'],
                ['Weight (kg)', weightKg, setWeightKg, '70'],
              ].map(([label, val, setter, placeholder]) => (
                <div key={String(label)}>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{label}</label>
                  <input value={val as string} onChange={(e) => (setter as Function)(e.target.value)} placeholder={placeholder as string}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Emergency Contact</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                ['Name', ecName, setEcName, 'Contact name'],
                ['Relationship', ecRelationship, setEcRelationship, 'e.g. Spouse'],
                ['Phone', ecPhone, setEcPhone, '+91 ...'],
              ].map(([label, val, setter, placeholder]) => (
                <div key={String(label)}>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">{label}</label>
                  <input value={val as string} onChange={(e) => (setter as Function)(e.target.value)} placeholder={placeholder as string}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-xs transition-all">
            <span className="material-symbols-outlined text-[16px]">logout</span>Sign Out
          </button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={() => { setIsEditing(false); setSaveError(''); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5">
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs">Close</button>
                <button onClick={() => setIsEditing(true)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20">
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
