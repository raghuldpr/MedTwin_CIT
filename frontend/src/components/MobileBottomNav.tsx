import React from 'react';
import { LayoutGrid, User, Activity, Pill, MoreHorizontal, Mic } from 'lucide-react';
import { NavItem } from './Sidebar';

interface MobileBottomNavProps {
  activeNav: NavItem;
  onNavigate: (item: NavItem) => void;
  onOpenVoiceAssistant: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeNav,
  onNavigate,
  onOpenVoiceAssistant,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 flex items-center justify-between z-40 shadow-lg">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
          activeNav === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => onNavigate('digital-twin')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
          activeNav === 'digital-twin' ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <User className="w-5 h-5" />
        <span>Twin</span>
      </button>

      {/* Center Voice Floating Button */}
      <button
        onClick={onOpenVoiceAssistant}
        className="w-12 h-12 -mt-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 ring-4 ring-white cursor-pointer hover:scale-105 transition-transform"
        title="Voice Assistant"
      >
        <Mic className="w-5 h-5" />
      </button>

      <button
        onClick={() => onNavigate('vitals')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
          activeNav === 'vitals' ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Activity className="w-5 h-5" />
        <span>Vitals</span>
      </button>

      <button
        onClick={() => onNavigate('medications')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
          activeNav === 'medications' ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Pill className="w-5 h-5" />
        <span>Meds</span>
      </button>

      <button
        onClick={() => onNavigate('documents')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
          activeNav === 'documents' || activeNav === 'consent' || activeNav === 'appointments'
            ? 'text-blue-600 font-bold'
            : 'text-slate-500'
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>More</span>
      </button>
    </div>
  );
};
