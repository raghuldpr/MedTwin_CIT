import React, { useState } from 'react';
import { HeartVisualizer } from './HeartVisualizer';

interface HeartDetailProps {
  onBack: () => void;
}

export const HeartDetail: React.FC<HeartDetailProps> = ({ onBack }) => {
  const [activeRail, setActiveRail] = useState('heart');
  const [bpm, setBpm] = useState(78);
  const [timelinePosition, setTimelinePosition] = useState(85);

  const railIcons = [
    { id: 'brain', icon: 'psychology', label: 'Brain' },
    { id: 'lungs', icon: 'pulmonology', label: 'Lungs' },
    { id: 'heart', icon: 'favorite', label: 'Heart', active: true },
    { id: 'stomach', icon: 'gastroenterology', label: 'Stomach' },
    { id: 'kidneys', icon: 'description', label: 'Documents' },
  ];

  return (
    <div className="flex min-h-screen bg-[#111722] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] select-none overflow-x-hidden">
      {/* Left Mini Icon Navigation Rail (Dark) */}
      <aside className="w-16 bg-[#0c1017] border-r border-slate-800/80 flex flex-col items-center py-6 gap-6 shrink-0 z-20">
        <div className="flex flex-col items-center gap-5">
          {railIcons.map((item) => {
            const isActive = item.id === activeRail;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveRail(item.id);
                  if (item.id !== 'heart') {
                    onBack();
                  }
                }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/40 scale-105'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                }`}
                title={item.label}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Center & Right Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - EXACT match for //header//button[.//span[text()='arrow_back_ios_new']] */}
        <header className="px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-800/60 bg-[#111722]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <h1 className="text-2xl font-black text-white tracking-tight">Heart</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
        </header>

        {/* Workspace: 3D Heart Visualizer + Right Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-6 lg:p-8 gap-6 items-start">
          {/* Left/Center Canvas Visualizer (8 cols on LG) */}
          <div className="lg:col-span-8 relative min-h-[560px] bg-[#0d121b] border border-slate-800/70 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08)_0%,transparent_70%)] pointer-events-none"></div>

            {/* 3D Heart Canvas Component */}
            <div className="flex-1 flex items-center justify-center relative">
              <HeartVisualizer bpm={bpm} interactive={true} />
            </div>

            {/* Bottom Overlay Floating Metric Cards */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Card 1: Heart Rate */}
              <div className="bg-[#151c27]/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Heart Rate</span>
                  <span className="material-symbols-outlined text-blue-400 text-[20px]">ssid_chart</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{bpm}</span>
                  <span className="text-xs text-slate-400 font-medium">bpm</span>
                </div>
              </div>

              {/* Card 2: Blood Flow */}
              <div className="bg-[#151c27]/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Blood Flow</span>
                  <span className="material-symbols-outlined text-sky-400 text-[20px]">water_drop</span>
                </div>
                <div className="mt-3">
                  <span className="text-base font-bold text-emerald-400">Normal</span>
                  {/* 4 segmented status bars */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                    <div className="h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="h-1.5 rounded-full bg-slate-700"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Detailed Medical Intelligence Panel (4 cols on LG) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Heart Overview Card */}
            <div className="bg-[#141b26] border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">HEART OVERVIEW</h3>
              <div className="space-y-3 divide-y divide-slate-800/60 text-sm">
                <div className="flex items-center justify-between pt-2 first:pt-0">
                  <span className="text-slate-400">Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Stable
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400">Heart Rate</span>
                  <span className="text-white font-bold">{bpm} bpm</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400">Rhythm</span>
                  <span className="text-white font-semibold">Normal Sinus Rhythm</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400">Cardiac Output</span>
                  <span className="text-white font-bold">5.2 L/min</span>
                </div>
              </div>
            </div>

            {/* 2. Today's Timeline Card */}
            <div className="bg-[#141b26] border border-slate-800/80 rounded-3xl p-5 space-y-3.5 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">TODAY'S TIMELINE</h3>
              <div className="relative py-4">
                <div className="w-full h-1 bg-slate-800 rounded-full relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-rose-500 rounded-full"
                    style={{ width: `${timelinePosition}%` }}
                  ></div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shadow-md cursor-pointer"
                    style={{ left: `calc(${timelinePosition}% - 7px)` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>Now</span>
                </div>
              </div>
            </div>

            {/* 3. Heart Health Indicators Card */}
            <div className="bg-[#141b26] border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">HEART HEALTH INDICATORS</h3>
              <div className="space-y-3.5">
                {/* Blood Pressure */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                      <span className="material-symbols-outlined text-[20px]">favorite_border</span>
                    </div>
                    <span className="text-sm font-medium text-slate-300">Blood Pressure</span>
                  </div>
                  <span className="text-sm font-bold text-white">120/80 mmHg</span>
                </div>

                {/* Cholesterol */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">science</span>
                    </div>
                    <span className="text-sm font-medium text-slate-300">Cholesterol</span>
                  </div>
                  <span className="text-sm font-bold text-white">180 mg/dL</span>
                </div>

                {/* Exercise */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">directions_run</span>
                    </div>
                    <span className="text-sm font-medium text-slate-300">Exercise</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Good</span>
                </div>

                {/* Stress Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">self_improvement</span>
                    </div>
                    <span className="text-sm font-medium text-slate-300">Stress Level</span>
                  </div>
                  <span className="text-sm font-bold text-blue-400">Low</span>
                </div>
              </div>
            </div>

            {/* Bottom Back Button - EXACT match for //button[contains(., 'Back to Digital Twin')] */}
            <button
              onClick={onBack}
              className="w-full py-4 px-5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-2xl text-slate-200 text-sm font-bold flex items-center justify-center gap-3 transition-all hover:text-white shadow-lg active:scale-98"
            >
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              <span>Back to Digital Twin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
