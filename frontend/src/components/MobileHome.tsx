import React, { useState } from 'react';
import { DigitalTwinBody } from './DigitalTwinBody';

interface MobileHomeProps {
  onNavigateToHeart: () => void;
}

export const MobileHome: React.FC<MobileHomeProps> = ({ onNavigateToHeart }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedOrgan, setSelectedOrgan] = useState('Heart');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between max-w-md mx-auto relative shadow-2xl pb-24">
      {/* Top Mobile Header */}
      <header className="px-6 pt-7 pb-3 flex items-center justify-between">
        <div>
          <p className="text-blue-600 font-bold text-lg leading-tight">Good Morning,</p>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
            Aarav! <span className="text-xl">👋</span>
          </h2>
        </div>

        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          alt="Aarav Sharma"
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
        />
      </header>

      {/* Central 3D Digital Twin Visual Area */}
      <div className="relative px-6 py-2 flex flex-col items-center">
        {/* Floating Circular Organ Buttons */}
        <div className="w-full relative h-[360px] flex items-center justify-center">
          {/* Canvas Silhouette */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <DigitalTwinBody selectedOrgan={selectedOrgan} />
          </div>

          {/* Top-Left Organ: Brain */}
          <button
            onClick={() => setSelectedOrgan('Brain')}
            className={`absolute top-6 left-2 w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center transition-transform active:scale-90 ${
              selectedOrgan === 'Brain' ? 'text-blue-600 ring-2 ring-blue-500' : 'text-blue-500'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">psychology</span>
          </button>

          {/* Bottom-Left Organ: Cardiology / Heart (Exact match for //button[.//span[text()='cardiology']]) */}
          <button
            onClick={() => {
              setSelectedOrgan('Heart');
              onNavigateToHeart();
            }}
            className="absolute top-28 left-2 w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-transform active:scale-90 ring-2 ring-blue-400/40"
            title="Heart Detail"
          >
            <span className="material-symbols-outlined text-[24px] text-blue-600">cardiology</span>
          </button>

          {/* Top-Right Organ: Lungs */}
          <button
            onClick={() => setSelectedOrgan('Lungs')}
            className={`absolute top-6 right-2 w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center transition-transform active:scale-90 ${
              selectedOrgan === 'Lungs' ? 'text-blue-600 ring-2 ring-blue-500' : 'text-blue-500'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">pulmonology</span>
          </button>

          {/* Bottom-Right Organ: Kidneys / Docs */}
          <button
            onClick={() => setSelectedOrgan('Kidneys')}
            className={`absolute top-28 right-2 w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center transition-transform active:scale-90 ${
              selectedOrgan === 'Kidneys' ? 'text-blue-600 ring-2 ring-blue-500' : 'text-blue-500'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">description</span>
          </button>

          {/* Center-Bottom "Tap to interact" pill */}
          <div className="absolute bottom-1 z-10">
            <button
              onClick={onNavigateToHeart}
              className="bg-blue-50/90 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">3d_rotation</span>
              <span>Tap to interact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Vitals Section */}
      <div className="px-6 space-y-3.5 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl text-slate-900 tracking-tight">Live Vitals</h3>
          <span className="text-xs text-slate-400 font-medium">Updated 2 min ago</span>
        </div>

        {/* 2x2 Grid of Vitals Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Heart Rate Card */}
          <div
            onClick={onNavigateToHeart}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[110px] cursor-pointer active:scale-98 transition-all relative"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-rose-500 text-[22px]">favorite_border</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">78</span>
                <span className="text-xs text-slate-400 font-medium">bpm</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Heart Rate</p>
            </div>
          </div>

          {/* Blood Pressure Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[110px] relative">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-blue-500 text-[22px]">speed</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">120/80</span>
                <span className="text-[10px] text-slate-400 font-medium">mmHg</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Blood Pressure</p>
            </div>
          </div>

          {/* SpO2 Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-emerald-500 text-[22px]">air</span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">98</span>
                <span className="text-xs text-slate-400 font-medium">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">SpO2</p>
            </div>
          </div>

          {/* Glucose Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-amber-500 text-[22px]">water_drop</span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">116</span>
                <span className="text-[10px] text-slate-400 font-medium">mg/dL</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Glucose</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2.5 flex items-center justify-around z-30 shadow-lg">
        {[
          { name: 'Home', icon: 'home' },
          { name: 'Twin', icon: 'accessibility_new' },
          { name: 'Vitals', icon: 'vital_signs' },
          { name: 'Meds', icon: 'medication' },
          { name: 'More', icon: 'more_horiz' },
        ].map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                if (item.name === 'Twin') {
                  onNavigateToHeart();
                }
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-[11px]">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
