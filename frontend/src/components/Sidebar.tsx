import React from 'react';
import { 
  LayoutGrid, 
  User, 
  Activity, 
  Pill, 
  FileText, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  Settings, 
  ChevronDown, 
  Mic, 
  Heart,
  HelpCircle
} from 'lucide-react';
import { Patient } from '../types';

export type NavItem = 
  | 'dashboard' 
  | 'digital-twin' 
  | 'vitals' 
  | 'medications' 
  | 'documents' 
  | 'health-summary' 
  | 'appointments' 
  | 'consent' 
  | 'settings';

interface SidebarProps {
  activeNav: NavItem;
  onNavigate: (item: NavItem) => void;
  patient: Patient;
  onOpenVoiceAssistant: () => void;
  onSwitchPatient?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavigate,
  patient,
  onOpenVoiceAssistant,
  onSwitchPatient,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'digital-twin', label: 'Digital Twin', icon: User },
    { id: 'vitals', label: 'Vitals', icon: Heart },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'health-summary', label: 'Health Summary', icon: Sparkles },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'consent', label: 'Consent & Access', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0 px-4 py-5 select-none shrink-0 z-30">
      {/* Brand & Logo Header */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Heart className="w-5 h-5 fill-blue-600 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
              MedTwin
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
              Your Health. Your Twin.
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as NavItem)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs ring-1 ring-blue-500/10 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Voice Assistant Trigger & Patient Profile */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        {/* Voice Assistant Pill Widget */}
        <div
          onClick={onOpenVoiceAssistant}
          className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700">
                Voice Assistant
              </div>
              <div className="text-[9px] text-slate-400">Tap to speak</div>
            </div>
          </div>

          {/* Mini audio wave */}
          <div className="flex items-center gap-0.5">
            <span className="w-0.5 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="w-0.5 h-3.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="w-0.5 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Patient Profile Card */}
        <div
          onClick={onSwitchPatient}
          className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
          title="Click to toggle demo profile"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden ring-2 ring-slate-100 shrink-0">
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
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {patient.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Patient ID: {patient.patientId}
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </aside>
  );
};
