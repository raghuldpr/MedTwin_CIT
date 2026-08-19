import React, { useState } from 'react';
import { Medication } from '../types';
import { Plus, Pill, Clock, CheckCircle, Bell, Calendar, ChevronRight, X, AlertCircle } from 'lucide-react';

interface MedicationListProps {
  medications: Medication[];
  onAddMedication: (med: Medication) => void;
  onToggleStatus?: (medId: string) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  onAddMedication,
  onToggleStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'Current' | 'History' | 'Reminders'>('Current');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newInstructions, setNewInstructions] = useState('Take 1 tablet • Once daily');
  const [newTime, setNewTime] = useState('08:00 AM');

  const filteredMeds = medications.filter((m) => {
    if (activeTab === 'Current') return true;
    if (activeTab === 'History') return m.status === 'Taken';
    if (activeTab === 'Reminders') return m.status === 'Upcoming';
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: newName,
      dosage: newDosage || '5mg',
      instructions: newInstructions,
      frequency: 'Once daily',
      time: newTime,
      status: 'Upcoming',
      dueText: 'In 4 hours',
      category: 'other',
      startDate: 'Today',
      prescribedBy: 'Self-logged',
    };

    onAddMedication(newMed);
    setNewName('');
    setNewDosage('');
    setShowAddModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            Medications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your active prescriptions and daily intake schedule</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer hover:scale-102 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200/80 pb-3">
        {(['Current', 'History', 'Reminders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Medications List */}
      <div className="space-y-3">
        {filteredMeds.map((med) => {
          const isTaken = med.status === 'Taken';

          return (
            <div
              key={med.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isTaken ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{med.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{med.instructions}</p>
                </div>
              </div>

              {/* Right Schedule & Status Pill */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {med.time}
                  </div>
                  {med.prescribedBy && (
                    <div className="text-[10px] text-slate-400">{med.prescribedBy}</div>
                  )}
                </div>

                {/* Status Badge */}
                {isTaken ? (
                  <button
                    onClick={() => onToggleStatus?.(med.id)}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Taken</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onToggleStatus?.(med.id)}
                    className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {med.dueText || 'Upcoming'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Medication</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medication Name & Strength
                </label>
                <input
                  type="text"
                  placeholder="e.g. Atorvastatin 20mg"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dosage / Form
                  </label>
                  <input
                    type="text"
                    placeholder="1 tablet"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    placeholder="08:00 AM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions
                </label>
                <input
                  type="text"
                  placeholder="Take 1 tablet • Once daily with meal"
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
