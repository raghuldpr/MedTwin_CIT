import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DigitalTwinViewer } from '../components/DigitalTwinViewer';
import { Organ3DHeart } from '../components/Organ3DHeart';
import { MedicalWaveform } from '../components/MedicalWaveform';
import { currentPatient, organsData } from '../data/mockData';
import { OrganId } from '../types';

interface MobileAppViewProps {
  currentTab?: 'home' | 'twin' | 'vitals' | 'meds' | 'more';
}

export const MobileAppView: React.FC<MobileAppViewProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOrgan, setSelectedOrgan] = useState<OrganId>('heart');

  const isHeartDetail = location.pathname.includes('/organ/heart');
  const isOrganDetail = location.pathname.startsWith('/organ/');

  return (
    <div className="w-full min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between max-w-md mx-auto relative select-none pb-20 shadow-2xl">
      {/* 1. Mobile Status Bar (9:41, Cellular, Wifi, Battery) */}
      <div className="w-full flex items-center justify-between px-6 pt-3 pb-1 text-xs text-slate-300 font-medium">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-[14px]">wifi</span>
          <span className="material-symbols-outlined text-[14px]">battery_full</span>
        </div>
      </div>

      {/* 2. Top Header Bar */}
      {!isOrganDetail ? (
        <div className="w-full flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              Good Morning,
            </h2>
            <p className="text-lg font-black text-white flex items-center gap-1">
              {currentPatient.name.split(' ')[0]}! <span>👋</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/voice-assistant')}
              className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>
            <img
              src={currentPatient.avatarUrl}
              alt={currentPatient.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40"
            />
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-between px-5 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            <span className="text-base font-bold capitalize">Heart</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div>
      )}

      {/* 3. Main Screen Body */}
      <div className="flex-1 flex flex-col px-4 overflow-y-auto gap-4">
        {/* VIEW A: Mobile Organ Detail (Heart) */}
        {isOrganDetail ? (
          <div className="flex flex-col items-center gap-4">
            {/* Large Floating 3D Heart */}
            <div className="w-full h-64 flex items-center justify-center relative">
              <Organ3DHeart bpm={78} interactive={true} />
            </div>

            {/* Heart Rate + Waveform Card */}
            <div className="w-full bg-[#0D1424] rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Heart Rate</span>
                <span className="text-xs font-bold text-emerald-400">● Stable</span>
              </div>
              <div className="my-1">
                <span className="text-2xl font-black text-white">78</span>{' '}
                <span className="text-xs text-slate-400">bpm</span>
              </div>
              <MedicalWaveform type="ecg" color="#f43f5e" height={28} />
            </div>

            {/* Metrics List */}
            <div className="w-full bg-[#0D1424] rounded-2xl p-4 border border-slate-800 flex flex-col gap-2.5 divide-y divide-slate-800/80">
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-blue-400">water_drop</span>
                  Blood Pressure
                </span>
                <span className="font-semibold text-white">120/80 mmHg</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-rose-400">favorite</span>
                  Rhythm
                </span>
                <span className="font-semibold text-emerald-400">Normal</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-sky-400">speed</span>
                  Cardiac Output
                </span>
                <span className="font-semibold text-white">5.2 L/min</span>
              </div>
            </div>

            {/* Back to Digital Twin Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-bold border border-slate-700 shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
              Back to Digital Twin
            </button>
          </div>
        ) : (
          /* VIEW B: Mobile Home with 3D Human + Chips + Vitals */
          <div className="flex flex-col gap-4">
            {/* 3D Human Model with Touch Organ Nodes */}
            <div className="w-full bg-[#0D1424] rounded-3xl p-4 border border-slate-800 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between z-10">
                <span className="text-xs font-bold text-slate-300">Digital Twin</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live
                </span>
              </div>

              {/* 3D Canvas */}
              <div className="w-full h-72 flex items-center justify-center relative">
                <DigitalTwinViewer
                  selectedOrgan={selectedOrgan}
                  onSelectOrgan={(id) => {
                    setSelectedOrgan(id);
                    navigate(`/organ/${id}`);
                  }}
                  showControls={false}
                />
              </div>

              {/* Quick Organ Capsule Buttons */}
              <div className="w-full flex items-center justify-around gap-1 pt-2 z-10">
                {[
                  { id: 'brain', label: 'Brain', icon: 'psychology' },
                  { id: 'lungs', label: 'Lungs', icon: 'pulmonology' },
                  { id: 'heart', label: 'Heart', icon: 'favorite', isAction: true },
                  { id: 'kidneys', label: 'Kidneys', icon: 'nephrology' },
                  { id: 'stomach', label: 'Stomach', icon: 'gastroenterology' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/organ/${item.id}`)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] transition-all ${
                      item.id === 'heart'
                        ? 'bg-blue-600/30 border border-blue-500/80 text-blue-400 font-bold'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {item.isAction ? 'cardiology' : item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Vitals 2x2 Grid */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300">Live Vitals</span>
                <span className="text-[10px] text-slate-500">Updated 2 min ago</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => navigate('/organ/heart')}
                  className="bg-[#0D1424] p-3 rounded-2xl border border-slate-800 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Heart Rate</span>
                    <span className="material-symbols-outlined text-[14px] text-rose-500">favorite</span>
                  </div>
                  <div className="text-lg font-black text-white my-0.5">78 <span className="text-xs font-normal text-slate-400">bpm</span></div>
                  <MedicalWaveform type="ecg" color="#f43f5e" height={20} />
                </div>

                <div
                  onClick={() => navigate('/organ/heart')}
                  className="bg-[#0D1424] p-3 rounded-2xl border border-slate-800 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Blood Pressure</span>
                    <span className="material-symbols-outlined text-[14px] text-blue-500">water_drop</span>
                  </div>
                  <div className="text-lg font-black text-white my-0.5">120/80 <span className="text-xs font-normal text-slate-400">mmHg</span></div>
                  <MedicalWaveform type="bp" color="#3b82f6" height={20} />
                </div>

                <div
                  onClick={() => navigate('/organ/lungs')}
                  className="bg-[#0D1424] p-3 rounded-2xl border border-slate-800 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>SpO₂</span>
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">air</span>
                  </div>
                  <div className="text-lg font-black text-white my-0.5">98 <span className="text-xs font-normal text-slate-400">%</span></div>
                  <MedicalWaveform type="spo2" color="#10b981" height={20} />
                </div>

                <div
                  onClick={() => navigate('/vitals')}
                  className="bg-[#0D1424] p-3 rounded-2xl border border-slate-800 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Glucose</span>
                    <span className="material-symbols-outlined text-[14px] text-purple-500">bloodtype</span>
                  </div>
                  <div className="text-lg font-black text-white my-0.5">116 <span className="text-xs font-normal text-slate-400">mg/dL</span></div>
                  <MedicalWaveform type="glucose" color="#a855f7" height={20} />
                </div>
              </div>
            </div>

            {/* AI Health Summary Card */}
            <div className="bg-[#0D1424] rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-400">auto_awesome</span>
                  AI Health Summary
                </span>
                <span className="text-[9px] text-slate-500">Generated just now</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Overall, your health indicators are within normal ranges. Keep maintaining your medication schedule and daily hydration.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Fixed Bottom Navigation Bar matching Image 1 & 2 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0B101E]/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around z-50">
        {[
          { label: 'Home', icon: 'home', path: '/' },
          { label: 'Twin', icon: 'accessibility_new', path: '/digital-twin' },
          { label: 'Vitals', icon: 'favorite_border', path: '/vitals' },
          { label: 'Meds', icon: 'medication', path: '/medications' },
          { label: 'More', icon: 'menu', path: '/settings' },
        ].map((tab) => {
          const isActive =
            tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path);

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
