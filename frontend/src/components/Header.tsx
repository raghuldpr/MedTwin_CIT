import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const Header: React.FC<HeaderProps> = ({ onSearch, onOpenNotifications, onOpenProfile }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 md:px-8 bg-transparent">
      {/* Greeting */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          {getGreeting()}, {firstName}! <span className="text-2xl">👋</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
          Here's your health overview for today
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Search Bar */}
        <div className="relative hidden sm:block w-48 md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text" placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); onSearch?.(e.target.value); }}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-white/80 border border-slate-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-xs"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); onOpenNotifications?.(); }}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-xs relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white">3</span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span onClick={() => setShowNotifications(false)} className="text-[10px] text-blue-600 font-semibold cursor-pointer">Dismiss</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="p-2 rounded-xl bg-blue-50/50 text-[11px] text-slate-700">
                  <p className="font-semibold text-blue-700">Heart Telemetry Synced</p>
                  <p className="text-slate-500 text-[10px]">Resting sinus rhythm optimal.</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/50 text-[11px] text-slate-700">
                  <p className="font-semibold text-amber-700">Medication Reminder</p>
                  <p className="text-slate-500 text-[10px]">Check your medication schedule.</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/50 text-[11px] text-slate-700">
                  <p className="font-semibold text-emerald-700">Digital Twin Updated</p>
                  <p className="text-slate-500 text-[10px]">All organ data freshly synced.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 p-1 md:pr-3 rounded-full bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-1 ring-slate-100">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight">Hello, {firstName}</p>
            <p className="text-[10px] text-slate-400">Patient</p>
          </div>
          <span className="material-symbols-outlined text-[16px] text-slate-400 hidden lg:inline">expand_more</span>
        </div>
      </div>
    </header>
  );
};
