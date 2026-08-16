import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DigitalTwinViewer } from '../components/DigitalTwinViewer';
import { MedicalWaveform } from '../components/MedicalWaveform';
import { organsData } from '../data/mockData';
import { OrganId } from '../types';
import { usePatientData } from '../context/PatientDataContext';
import type { BackendVital, BackendOrgan } from '../services/patient.api';

// Map backend organ system enum to UI organ IDs
const ORGAN_SYSTEM_MAP: Record<string, OrganId> = {
  CARDIOVASCULAR: 'heart',
  RESPIRATORY: 'lungs',
  NERVOUS: 'brain',
  DIGESTIVE: 'stomach',
  RENAL: 'kidneys',
  HEPATIC: 'liver',
  MUSCULOSKELETAL: 'muscles',
  ENDOCRINE: 'skin',
  IMMUNE: 'bones',
  REPRODUCTIVE: 'bladder',
};

const getOrganStatus = (organs: BackendOrgan[], system: string): string => {
  const organ = organs.find((o) => o.system === system);
  return organ ? organ.status.charAt(0) + organ.status.slice(1).toLowerCase() : 'Normal';
};

const getLatestVital = (vitals: BackendVital[]): BackendVital | null =>
  vitals.length > 0 ? vitals[0] : null;

export const DesktopDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { vitals, organs, isLoading, error, reload } = usePatientData();
  const [selectedOrgan, setSelectedOrgan] = useState<OrganId>('heart');

  const leftOrgans: OrganId[] = ['brain', 'lungs', 'heart', 'liver', 'stomach'];
  const rightOrgans: OrganId[] = ['kidneys', 'bladder', 'muscles', 'bones', 'skin'];

  const latest = getLatestVital(vitals);

  const handleOrganClick = (organId: OrganId) => {
    setSelectedOrgan(organId);
    navigate(`/organ/${organId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading Digital Twin...</p>
        </div>
      </div>
    );
  }

  if (error && vitals.length === 0 && organs.length === 0) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <span className="material-symbols-outlined text-rose-400 text-[48px]">cloud_off</span>
          <p className="text-slate-800 font-bold">Failed to Load Patient Data</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={reload} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-6 lg:p-8 pt-2 overflow-y-auto max-w-[1600px] mx-auto gap-6">
      {/* Main Hero Grid: Left Organs + 3D Human Model + Right Organs + Live Vitals Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Central Digital Twin Area (8 Cols on Desktop) */}
        <div className="xl:col-span-7 2xl:col-span-8 bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100/90 shadow-xs hover:shadow-md hover:border-slate-200/80 transition-all duration-300 ease-out relative flex flex-col items-center justify-between min-h-[580px]">
          {/* Header Info */}
          <div className="w-full flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Digital Twin Overview
              </h2>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live • Synced just now
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Click any organ to inspect 3D telemetry
              </span>
            </div>
          </div>

          {/* Body Anatomy + Organ Selectors Sidebars */}
          <div className="w-full flex items-center justify-between relative my-2">
            {/* Left Organ Selectors */}
            <div className="flex flex-col gap-3.5 z-10">
              {leftOrgans.map((id) => {
                const organ = organsData[id];
                if (!organ) return null;
                const isSelected = selectedOrgan === id;
                // Find the backend organ system name corresponding to this UI organ
                const backendSystem = Object.entries(ORGAN_SYSTEM_MAP).find(([, v]) => v === id)?.[0];
                const realStatus = backendSystem ? getOrganStatus(organs, backendSystem) : organ.status;

                return (
                  <div
                    key={id}
                    id={`organ-btn-${id}`}
                    onClick={() => handleOrganClick(id)}
                    className={`cursor-pointer group flex items-center gap-3 px-3.5 py-2 rounded-2xl transition-all duration-300 ease-out transform ${
                      isSelected
                        ? 'bg-blue-500/10 border-2 border-blue-500/70 shadow-md shadow-blue-500/15 scale-105'
                        : 'bg-white/90 border border-slate-100/90 hover:border-blue-300 hover:bg-white hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs transition-transform duration-300 ease-out group-hover:scale-110 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : id === 'heart'
                          ? 'bg-rose-500 text-white'
                          : id === 'brain'
                          ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                          : id === 'lungs'
                          ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {id === 'heart'
                          ? 'favorite'
                          : id === 'brain'
                          ? 'psychology'
                          : id === 'lungs'
                          ? 'pulmonology'
                          : id === 'liver'
                          ? 'medication_liquid'
                          : 'gastroenterology'}
                      </span>
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                        {organ.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{organ.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Central 3D Digital Twin Human Model */}
            <div className="flex-1 flex items-center justify-center h-[460px] relative px-2">
              <DigitalTwinViewer
                selectedOrgan={selectedOrgan}
                onSelectOrgan={(id) => handleOrganClick(id)}
                showControls={false}
              />
            </div>

            {/* Right Organ Selectors */}
            <div className="flex flex-col gap-3.5 z-10">
              {rightOrgans.map((id) => {
                const organ = organsData[id];
                if (!organ) return null;
                const isSelected = selectedOrgan === id;
                const backendSystem = Object.entries(ORGAN_SYSTEM_MAP).find(([, v]) => v === id)?.[0];
                const realStatus = backendSystem ? getOrganStatus(organs, backendSystem) : organ.status;

                return (
                  <div
                    key={id}
                    id={`organ-btn-${id}`}
                    onClick={() => handleOrganClick(id)}
                    className={`cursor-pointer group flex items-center gap-3 px-3.5 py-2 rounded-2xl transition-all duration-300 ease-out transform ${
                      isSelected
                        ? 'bg-blue-500/10 border-2 border-blue-500/70 shadow-md shadow-blue-500/15 scale-105'
                        : 'bg-white/90 border border-slate-100/90 hover:border-blue-300 hover:bg-white hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs transition-transform duration-300 ease-out group-hover:scale-110 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : id === 'kidneys'
                          ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                          : id === 'bladder'
                          ? 'bg-cyan-100 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white'
                          : id === 'muscles'
                          ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                          : id === 'bones'
                          ? 'bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white'
                          : 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {id === 'kidneys'
                          ? 'nephrology'
                          : id === 'bladder'
                          ? 'water_drop'
                          : id === 'muscles'
                          ? 'fitness_center'
                          : id === 'bones'
                          ? 'accessibility'
                          : 'dermatology'}
                      </span>
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                        {organ.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{organ.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom "View in 3D" Action Pill */}
          <div className="w-full flex items-center justify-center pt-2 z-10">
            <button
              onClick={() => navigate('/digital-twin')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-semibold hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 ease-out active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-12">view_in_ar</span>
              View in 3D
            </button>
          </div>
        </div>

        {/* Right Column: Live Vitals (5 Cols on Desktop) */}
        <div className="xl:col-span-5 2xl:col-span-4 flex flex-col gap-5">
          {/* Live Vitals Header & Grid */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-100/90 shadow-xs hover:shadow-md hover:border-slate-200/80 transition-all duration-300 ease-out flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Vitals</h3>
                <p className="text-[11px] text-slate-400">
                  {latest ? `Recorded ${new Date(latest.recordedAt).toLocaleString()}` : 'No vitals recorded yet'}
                </p>
              </div>
              <button
                onClick={() => navigate('/vitals')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200"
              >
                View All
              </button>
            </div>

            {/* 2x3 Vitals Grid matching Image 1 with smooth hover card transitions */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Heart Rate */}
              <div
                onClick={() => navigate('/organ/heart')}
                className="group bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-lg hover:shadow-rose-500/10 hover:border-rose-300 hover:-translate-y-1 hover:bg-gradient-to-b hover:from-white hover:to-rose-50/20 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors duration-200">Heart Rate</span>
                  <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 transition-transform duration-300 ease-out group-hover:scale-115 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                  </div>
                </div>
                <div className="my-2">
                   <span className="text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors duration-200">
                     {latest?.heartRate ?? '—'}
                   </span>{' '}
                   <span className="text-xs text-slate-500 font-medium">bpm</span>
                 </div>
                <div className="transition-opacity duration-300 group-hover:opacity-100 opacity-90">
                  <MedicalWaveform type="ecg" color="#f43f5e" height={26} />
                </div>
              </div>

              {/* Blood Pressure */}
              <div
                onClick={() => navigate('/organ/heart')}
                className="group bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300 hover:-translate-y-1 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/20 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors duration-200">Blood Pressure</span>
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 transition-transform duration-300 ease-out group-hover:scale-115 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-[14px]">water_drop</span>
                  </div>
                </div>
                <div className="my-2">
                   <span className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                     {latest?.systolicBP && latest?.diastolicBP
                       ? `${latest.systolicBP}/${latest.diastolicBP}`
                       : '—'}
                   </span>{' '}
                   <span className="text-xs text-slate-500 font-medium">mmHg</span>
                 </div>
                <div className="transition-opacity duration-300 group-hover:opacity-100 opacity-90">
                  <MedicalWaveform type="bp" color="#3b82f6" height={26} />
                </div>
              </div>

              {/* SpO2 */}
              <div
                onClick={() => navigate('/organ/lungs')}
                className="group bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300 hover:-translate-y-1 hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/20 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors duration-200">SpO₂</span>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 transition-transform duration-300 ease-out group-hover:scale-115 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-[14px]">air</span>
                  </div>
                </div>
                <div className="my-2">
                   <span className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors duration-200">
                     {latest?.spo2 ?? '—'}
                   </span>{' '}
                   <span className="text-xs text-slate-500 font-medium">%</span>
                 </div>
                <div className="transition-opacity duration-300 group-hover:opacity-100 opacity-90">
                  <MedicalWaveform type="spo2" color="#10b981" height={26} />
                </div>
              </div>

              {/* Glucose */}
              <div
                onClick={() => navigate('/vitals')}
                className="group bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-300 hover:-translate-y-1 hover:bg-gradient-to-b hover:from-white hover:to-purple-50/20 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors duration-200">Glucose</span>
                  <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 transition-transform duration-300 ease-out group-hover:scale-115 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-[14px]">bloodtype</span>
                  </div>
                </div>
                <div className="my-2">
                   <span className="text-xl font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors duration-200">
                     {latest?.bloodGlucose ?? '—'}
                   </span>{' '}
                   <span className="text-xs text-slate-500 font-medium">mg/dL</span>
                 </div>
                <div className="transition-opacity duration-300 group-hover:opacity-100 opacity-90">
                  <MedicalWaveform type="glucose" color="#a855f7" height={26} />
                </div>
              </div>

              {/* Respiratory Rate */}
              <div
                onClick={() => navigate('/organ/lungs')}
                className="group bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-300 hover:-translate-y-1 hover:bg-gradient-to-b hover:from-white hover:to-sky-50/20 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors duration-200">Respiratory Rate</span>
                  <span className="material-symbols-outlined text-[14px] text-slate-300 group-hover:text-sky-500 transition-colors duration-200">description</span>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors duration-200">{latest?.respiratoryRate ?? '—'}</span>{' '}
                  <span className="text-xs text-slate-500 font-medium">rpm</span>
                </div>
              </div>

              {/* Temperature */}
              <div
                onClick={() => navigate('/vitals')}
                className="group bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-300 hover:-translate-y-1 hover:bg-gradient-to-b hover:from-white hover:to-amber-50/20 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors duration-200">Temperature</span>
                  <span className="material-symbols-outlined text-[14px] text-slate-300 group-hover:text-amber-500 transition-colors duration-200">device_thermostat</span>
                </div>
                <div className="mt-2">
                   <span className="text-xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors duration-200">
                     {latest?.temperatureC ?? '—'}
                   </span>{' '}
                   <span className="text-xs text-slate-500 font-medium">°C</span>
                 </div>
               </div>
            </div>
          </div>

          {/* AI Health Summary Card with hover transition animation */}
          <div className="group bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-100/90 shadow-xs hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200/80 hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">AI Health Summary</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Generated just now</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Your overall health is stable. Heart rate, blood pressure and oxygen saturation are in normal range. Continue your medications on time and maintain a balanced diet. Great job staying consistent! 👍
            </p>

            <div className="pt-1">
              <button
                onClick={() => navigate('/health-summary')}
                className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all duration-200 active:scale-98"
              >
                View Full Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
