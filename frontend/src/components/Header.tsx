import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Patient } from '../types';

interface HeaderProps {
  patient: Patient;
  onSearchChange?: (q: string) => void;
  onOpenNotifications?: () => void;
  onSwitchPatient?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  patient,
  onSearchChange,
  onOpenNotifications,
  onSwitchPatient,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 px-1">
      {/* Greeting Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Good Morning, {patient.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Here's your health overview for today
        </p>
      </div>

      {/* Right Controls: Search, Notification Bell, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs w-48 sm:w-64 transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Profile Pill */}
        <div
          onClick={onSwitchPatient}
          className="flex items-center gap-2 pl-2 pr-3 py-1 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          title="Click to switch profile"
        >
          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden ring-1 ring-slate-100">
            {patient.avatar ? (
              <img
                src={patient.avatar}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <span>{patient.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {patient.name}
            </div>
            <div className="text-[10px] text-slate-400">Patient</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
};
