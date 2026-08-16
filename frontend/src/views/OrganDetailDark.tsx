import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Organ3DHeart } from '../components/Organ3DHeart';
import { Organ3DBrain } from '../components/Organ3DBrain';
import { Organ3DLungs } from '../components/Organ3DLungs';
import { Organ3DKidneys } from '../components/Organ3DKidneys';
import { MedicalWaveform } from '../components/MedicalWaveform';
import { organsData } from '../data/mockData';
import { OrganId } from '../types';

export const OrganDetailDark: React.FC = () => {
  const { organId = 'heart' } = useParams<{ organId: string }>();
  const navigate = useNavigate();

  const currentOrganKey = (organId.toLowerCase() in organsData ? organId.toLowerCase() : 'heart') as OrganId;
  const organ = organsData[currentOrganKey] || organsData.heart;

  const organIcons: { id: OrganId; name: string; icon: string }[] = [
    { id: 'brain', name: 'Brain', icon: 'psychology' },
    { id: 'lungs', name: 'Lungs', icon: 'pulmonology' },
    { id: 'heart', name: 'Heart', icon: 'favorite' },
    { id: 'liver', name: 'Liver', icon: 'medication_liquid' },
    { id: 'stomach', name: 'Stomach', icon: 'gastroenterology' },
    { id: 'kidneys', name: 'Kidneys', icon: 'nephrology' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#070B14] text-slate-100 flex flex-col md:flex-row overflow-x-hidden select-none font-sans">
      {/* 1. Left Organ Navigation Rail matching Image 1 */}
      <div className="w-full md:w-16 bg-[#0B101E]/90 border-b md:border-b-0 md:border-r border-slate-800/80 flex md:flex-col items-center justify-between md:justify-start p-3 md:py-6 gap-3 z-30">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          title="Back to Dashboard"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
        </button>

        <div className="hidden md:block w-8 h-px bg-slate-800/80 my-2"></div>

        {/* Organ Switcher Rail */}
        <div className="flex md:flex-col items-center gap-2 overflow-x-auto md:overflow-visible">
          {organIcons.map((item) => {
            const isActive = currentOrganKey === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/organ/${item.id}`)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-slate-900/60 border border-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={item.name}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto max-w-[1700px] mx-auto w-full">
        {/* Dark Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="md:hidden flex items-center text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white capitalize">
              {organ.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{organ.status}</span>
          </div>
        </div>

        {/* 3. Hero Layout: Floating 3D Organ (Left 7 cols) + Telemetry Panels (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-start">
          {/* Left: Floating 3D Organ & Lower Metrics */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6">
            {/* Real Holographic 3D Floating Organ */}
            <div className="w-full min-h-[380px] md:min-h-[460px] flex items-center justify-center relative">
              {currentOrganKey === 'heart' && <Organ3DHeart bpm={78} />}
              {currentOrganKey === 'brain' && <Organ3DBrain />}
              {currentOrganKey === 'lungs' && <Organ3DLungs />}
              {currentOrganKey === 'kidneys' && <Organ3DKidneys />}
              {currentOrganKey !== 'heart' &&
                currentOrganKey !== 'brain' &&
                currentOrganKey !== 'lungs' &&
                currentOrganKey !== 'kidneys' && <Organ3DHeart bpm={78} />}
            </div>

            {/* Lower Telemetry Cards matching Image 1 */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lower Card 1: Primary Metric + Wave */}
              <div className="bg-[#0D1424]/80 backdrop-blur-md rounded-2xl p-4 border border-slate-800/80 shadow-lg flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">{organ.primaryMetric.label}</span>
                <div className="my-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">{organ.primaryMetric.value}</span>
                  {organ.primaryMetric.unit && (
                    <span className="text-xs text-slate-400">{organ.primaryMetric.unit}</span>
                  )}
                </div>
                <MedicalWaveform
                  type={organ.waveformType}
                  color={
                    currentOrganKey === 'brain'
                      ? '#818cf8'
                      : currentOrganKey === 'lungs'
                      ? '#38bdf8'
                      : currentOrganKey === 'kidneys'
                      ? '#38bdf8'
                      : '#f43f5e'
                  }
                  height={30}
                />
              </div>

              {/* Lower Card 2: Blood Flow / Neural / Filtration status visual */}
              <div className="bg-[#0D1424]/80 backdrop-blur-md rounded-2xl p-4 border border-slate-800/80 shadow-lg flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {currentOrganKey === 'brain'
                    ? 'Synaptic Connectivity'
                    : currentOrganKey === 'lungs'
                    ? 'Gas Diffusion'
                    : currentOrganKey === 'kidneys'
                    ? 'Glomerular Clearance'
                    : 'Blood Flow'}
                </span>
                <div className="my-1 flex items-center justify-between">
                  <span className="text-base font-bold text-emerald-400">Normal</span>
                  <span className="text-[10px] text-slate-500 font-mono">FLOW: 100%</span>
                </div>
                {/* Micro particle stream visualization */}
                <div className="w-full h-7 bg-slate-900/90 rounded-lg overflow-hidden relative border border-slate-800 flex items-center px-2">
                  <div className="w-full flex items-center justify-between gap-1">
                    {[...Array(12)].map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-ping"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1.4s' }}
                      ></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Organ Overview, Timeline, Indicators & Back Button */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Organ Overview Card */}
            <div className="bg-[#0D1424]/90 backdrop-blur-md rounded-3xl p-5 border border-slate-800/80 shadow-xl flex flex-col gap-3">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                {organ.name} Overview
              </h3>

              <div className="flex flex-col gap-2.5 divide-y divide-slate-800/60 pt-1">
                {organ.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-2.5 text-xs">
                    <span className="text-slate-400 font-medium">{m.label}</span>
                    <span
                      className={`font-semibold ${
                        m.statusColor ? m.statusColor : 'text-slate-100'
                      }`}
                    >
                      {m.label === 'Status' ? `● ${m.value}` : m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Timeline Oscilloscope */}
            <div className="bg-[#0D1424]/90 backdrop-blur-md rounded-3xl p-5 border border-slate-800/80 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Today's Timeline
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">24h Telemetry</span>
              </div>

              <div className="relative py-1">
                <MedicalWaveform
                  type={organ.waveformType}
                  color={
                    currentOrganKey === 'brain'
                      ? '#a5b4fc'
                      : currentOrganKey === 'lungs'
                      ? '#7dd3fc'
                      : '#fb7185'
                  }
                  height={44}
                />
                {/* Tracker Indicator Point */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/80 animate-pulse"></div>
              </div>
            </div>

            {/* Health Indicators Card */}
            <div className="bg-[#0D1424]/90 backdrop-blur-md rounded-3xl p-5 border border-slate-800/80 shadow-xl flex flex-col gap-3">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                {organ.name} Health Indicators
              </h3>

              <div className="flex flex-col gap-3 pt-1">
                {organ.indicators.map((ind, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${ind.iconColor}`}>
                        {ind.icon}
                      </span>
                      <span className="text-slate-300 font-medium">{ind.label}</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        ind.valueColor ? ind.valueColor : 'text-slate-100'
                      }`}
                    >
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary "Back to Digital Twin" Action Button */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold tracking-wide border border-slate-700/80 hover:border-blue-500 shadow-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
                Back to Digital Twin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
