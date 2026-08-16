import React, { useState } from 'react';
import { DigitalTwinBody } from './DigitalTwinBody';

interface DesktopDashboardProps {
  onNavigateToHeart: () => void;
  onNavigateToMobile?: () => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  onNavigateToHeart,
  onNavigateToMobile,
}) => {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [selectedOrgan, setSelectedOrgan] = useState('Heart');
  const [searchQuery, setSearchQuery] = useState('');
  const [is3DMode, setIs3DMode] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [assistantMessage, setAssistantMessage] = useState(
    "Hello Aarav! I'm monitoring your digital twin. All 10 vital organs are currently in optimal condition."
  );

  const navItems = [
    { name: 'Dashboard', icon: 'grid_view' },
    { name: 'Digital Twin', icon: 'accessibility_new' },
    { name: 'Vitals', icon: 'vital_signs' },
    { name: 'Medications', icon: 'medication' },
    { name: 'Documents', icon: 'description' },
    { name: 'Health Summary', icon: 'bar_chart' },
    { name: 'Appointments', icon: 'calendar_today' },
    { name: 'Consent & Access', icon: 'shield_person' },
    { name: 'Settings', icon: 'settings' },
  ];

  const handleOrganClick = (organName: string) => {
    setSelectedOrgan(organName);
    if (organName === 'Heart') {
      onNavigateToHeart();
    }
  };

  const handleVoiceSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInput.trim()) return;
    const input = voiceInput.toLowerCase();
    if (input.includes('heart') || input.includes('cardio') || input.includes('bpm')) {
      setAssistantMessage("Your heart rate is 78 bpm and stable with normal sinus rhythm. Would you like me to open the 3D Heart Analysis?");
    } else if (input.includes('blood') || input.includes('pressure')) {
      setAssistantMessage("Blood pressure is optimal at 120/80 mmHg recorded 2 minutes ago.");
    } else {
      setAssistantMessage(`I've analyzed your telemetry for "${voiceInput}". Your health metrics are within target ranges.`);
    }
    setVoiceInput('');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-5 shrink-0 hidden lg:flex select-none">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 px-2 py-1 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">favorite</span>
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight text-blue-600 tracking-tight">MedTwin</h1>
              <p className="text-[11px] text-slate-400 font-normal">Your Health. Your Twin.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveNav(item.name);
                    if (item.name === 'Digital Twin') {
                      onNavigateToHeart();
                    }
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {/* Voice Assistant Button */}
          <button
            onClick={() => setShowVoiceAssistant(!showVoiceAssistant)}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-blue-50/90 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
            <span>Voice Assistant</span>
          </button>

          {/* User Profile Info */}
          <div className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Aarav Sharma"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <p className="font-bold text-sm text-slate-900 leading-tight">Aarav Sharma</p>
                <p className="text-[11px] text-slate-400">Patient ID: MT-78425</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="px-6 lg:px-8 py-5 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Good Morning, Aarav! <span className="text-xl">👋</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Here's your health overview for today</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden sm:block w-72">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border-0 rounded-full text-xs placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative w-9 h-9 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-600 hover:bg-slate-200/80 transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* Mobile View / Avatar */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Aarav Sharma"
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
          </div>
        </header>

        {/* Voice Assistant Modal Drawer */}
        {showVoiceAssistant && (
          <div className="px-6 lg:px-8 pt-4 pb-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-lg relative flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                  <span className="material-symbols-outlined animate-pulse text-[26px]">mic</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
                    MedTwin AI Voice Assistant
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-normal">Listening</span>
                  </h4>
                  <p className="text-xs text-blue-100 mt-1 max-w-xl">{assistantMessage}</p>
                </div>
              </div>

              <form onSubmit={handleVoiceSend} className="w-full md:w-auto flex items-center gap-2">
                <input
                  type="text"
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder="Ask about your heart, vitals, or organs..."
                  className="px-4 py-2 bg-white/15 placeholder:text-blue-200 text-white text-xs rounded-xl border border-white/20 focus:outline-none focus:bg-white/25 w-full md:w-72"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-colors shrink-0"
                >
                  Ask
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard Grid Container */}
        <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Center Digital Twin Card (7 Columns on XL) */}
          <div className="xl:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative min-h-[660px] flex flex-col justify-between overflow-hidden">
            {/* Background ambient radial circles */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

            {/* Organ Selectors Overlay - Grid with 2 Columns */}
            <div className="relative z-10 grid grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-4 pt-2">
              {/* Left Column Organ Nodes */}
              <div className="space-y-5">
                {/* Brain */}
                <div
                  onClick={() => handleOrganClick('Brain')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all ${
                    selectedOrgan === 'Brain' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">psychology</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Brain</p>
                    <p className="text-xs font-medium text-emerald-600">Healthy</p>
                  </div>
                </div>

                {/* Lungs */}
                <div
                  onClick={() => handleOrganClick('Lungs')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all ${
                    selectedOrgan === 'Lungs' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">pulmonology</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Lungs</p>
                    <p className="text-xs font-medium text-emerald-600">Good</p>
                  </div>
                </div>

                {/* Heart (SELECTED CARD - Exact match for XPath: //div[contains(@class, 'cursor-pointer') and .//p[text()='Heart']]) */}
                <div
                  onClick={() => handleOrganClick('Heart')}
                  className="bg-blue-600 text-white rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30 transition-transform active:scale-95"
                >
                  <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined text-[22px] animate-pulse">favorite</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white leading-tight">Heart</p>
                    <p className="text-xs text-blue-100 font-medium">Stable</p>
                  </div>
                </div>

                {/* Liver */}
                <div
                  onClick={() => handleOrganClick('Liver')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all ${
                    selectedOrgan === 'Liver' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">medication_liquid</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Liver</p>
                    <p className="text-xs font-medium text-emerald-600">Normal</p>
                  </div>
                </div>

                {/* Stomach */}
                <div
                  onClick={() => handleOrganClick('Stomach')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all ${
                    selectedOrgan === 'Stomach' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">gastroenterology</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Stomach</p>
                    <p className="text-xs font-medium text-emerald-600">Good</p>
                  </div>
                </div>
              </div>

              {/* Right Column Organ Nodes */}
              <div className="space-y-5 flex flex-col items-end text-right">
                {/* Kidneys */}
                <div
                  onClick={() => handleOrganClick('Kidneys')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all flex-row-reverse ${
                    selectedOrgan === 'Kidneys' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">nephrology</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Kidneys</p>
                    <p className="text-xs font-medium text-emerald-600">Normal</p>
                  </div>
                </div>

                {/* Bladder */}
                <div
                  onClick={() => handleOrganClick('Bladder')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all flex-row-reverse ${
                    selectedOrgan === 'Bladder' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">water_drop</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Bladder</p>
                    <p className="text-xs font-medium text-emerald-600">Normal</p>
                  </div>
                </div>

                {/* Muscles */}
                <div
                  onClick={() => handleOrganClick('Muscles')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all flex-row-reverse ${
                    selectedOrgan === 'Muscles' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">fitness_center</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Muscles</p>
                    <p className="text-xs font-medium text-emerald-600">Good</p>
                  </div>
                </div>

                {/* Bones */}
                <div
                  onClick={() => handleOrganClick('Bones')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all flex-row-reverse ${
                    selectedOrgan === 'Bones' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                    H4
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Bones</p>
                    <p className="text-xs font-medium text-emerald-600">Strong</p>
                  </div>
                </div>

                {/* Skin */}
                <div
                  onClick={() => handleOrganClick('Skin')}
                  className={`flex items-center gap-3.5 cursor-pointer p-2 rounded-2xl transition-all flex-row-reverse ${
                    selectedOrgan === 'Skin' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">dermatology</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-tight">Skin</p>
                    <p className="text-xs font-medium text-emerald-600">Healthy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Human Silhouette Canvas */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <DigitalTwinBody selectedOrgan={selectedOrgan} />
            </div>

            {/* Bottom 3D Action Pill */}
            <div className="relative z-10 flex justify-center mt-6">
              <button
                onClick={() => {
                  setIs3DMode(!is3DMode);
                  onNavigateToHeart();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">3d_rotation</span>
                <span>View in 3D</span>
              </button>
            </div>
          </div>

          {/* Right Column (5 Columns on XL) - Live Vitals & AI Summary */}
          <div className="xl:col-span-5 space-y-6">
            {/* Live Vitals Section */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">Live Vitals</h3>
                <span className="text-xs text-slate-400 font-medium">Last updated 2 min ago</span>
              </div>

              {/* 2x3 Vitals Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* 1. Heart Rate */}
                <div
                  onClick={onNavigateToHeart}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px] cursor-pointer hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Heart Rate</span>
                    <span className="material-symbols-outlined text-rose-500 text-[18px] group-hover:scale-110 transition-transform">
                      favorite_border
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">78</span>
                      <span className="text-xs text-slate-400 font-medium">bpm</span>
                    </div>
                    {/* Pink/Coral mini background baseline */}
                    <div className="w-full h-4 mt-2 rounded bg-rose-50/70 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-100/60 to-rose-200/40"></div>
                    </div>
                  </div>
                </div>

                {/* 2. Blood Pressure */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Blood Pressure</span>
                    <span className="material-symbols-outlined text-blue-500 text-[18px]">water_drop</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">120/80</span>
                      <span className="text-xs text-slate-400 font-medium">mmHg</span>
                    </div>
                    {/* Blue bar */}
                    <div className="w-full h-4 mt-2 rounded bg-blue-100/70 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-400/80"></div>
                    </div>
                  </div>
                </div>

                {/* 3. SpO2 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">SpO₂</span>
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">air</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">98</span>
                      <span className="text-xs text-slate-400 font-medium">%</span>
                    </div>
                    {/* Green soft bar */}
                    <div className="w-full h-4 mt-2 rounded bg-emerald-100/70 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-emerald-300/80"></div>
                    </div>
                  </div>
                </div>

                {/* 4. Glucose */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Glucose</span>
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">bloodtype</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">116</span>
                      <span className="text-xs text-slate-400 font-medium">mg/dL</span>
                    </div>
                    {/* Amber bar */}
                    <div className="w-full h-4 mt-2 rounded bg-amber-100/70 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-amber-300/80"></div>
                    </div>
                  </div>
                </div>

                {/* 5. Respiratory Rate */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Respiratory Rate</span>
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">description</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">16</span>
                      <span className="text-xs text-slate-400 font-medium">rpm</span>
                    </div>
                    {/* Dashed line */}
                    <div className="w-full h-4 mt-2 flex items-center">
                      <div className="w-full border-t border-dashed border-slate-300"></div>
                    </div>
                  </div>
                </div>

                {/* 6. Temperature */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Temperature</span>
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">device_thermostat</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">36.6</span>
                      <span className="text-xs text-slate-400 font-medium">°C</span>
                    </div>
                    {/* Dashed line */}
                    <div className="w-full h-4 mt-2 flex items-center">
                      <div className="w-full border-t border-dashed border-slate-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Health Summary Card */}
            <div className="bg-blue-50/80 border border-blue-100/90 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  <span>AI Health Summary</span>
                </div>
                <span className="bg-blue-100/80 text-blue-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  Generated just now
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Your overall health is stable. Heart rate, blood pressure and oxygen saturation are in normal
                range. Continue your medications on time and maintain a balanced diet. Great job staying consistent!
                👍
              </p>

              <button
                onClick={onNavigateToHeart}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-blue-600 text-center shadow-sm transition-colors"
              >
                View Full Summary
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
