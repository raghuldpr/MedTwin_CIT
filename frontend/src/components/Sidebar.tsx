import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onOpenVoiceAssistant?: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenVoiceAssistant,
  onOpenProfile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: 'grid_view', path: '/' },
    { label: 'Digital Twin', icon: 'accessibility_new', path: '/digital-twin' },
    { label: 'Vitals', icon: 'favorite_border', path: '/vitals' },
    { label: 'Medications', icon: 'medication', path: '/medications' },
    { label: 'Documents', icon: 'description', path: '/documents' },
    { label: 'Health Summary', icon: 'medical_services', path: '/health-summary' },
    { label: 'Appointments', icon: 'calendar_month', path: '/appointments' },
    { label: 'Consent & Access', icon: 'verified_user', path: '/consent' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const isCurrentActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0 z-30 select-none py-5 px-4 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      {/* Brand Logo & Name */}
      <div className="flex flex-col gap-6">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              MedTwin
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Your Health. Your Twin.</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active = isCurrentActive(item.path);
            return (
              <button
                key={item.label}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                  active
                    ? 'bg-blue-50/80 text-blue-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    active ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        {/* Voice Assistant Shortcut Card */}
        <button
          onClick={onOpenVoiceAssistant}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 border border-blue-100/80 text-blue-700 hover:bg-blue-100/80 transition-all text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Voice Assistant</p>
              <p className="text-[10px] text-slate-500">Tap to speak</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[16px] text-blue-500">graphic_eq</span>
        </button>

        {/* Patient Profile Card */}
        <div
          onClick={onOpenProfile}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-100 shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'P'}
            </div>
            <div className="text-left overflow-hidden min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name ?? 'Patient'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">expand_more</span>
        </div>
      </div>
    </aside>
  );
};
