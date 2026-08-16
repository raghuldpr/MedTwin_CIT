import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DesktopDashboard } from './views/DesktopDashboard';
import { OrganDetailDark } from './views/OrganDetailDark';
import { DigitalTwinFullPage } from './views/DigitalTwinFullPage';
import { VitalsPage } from './views/VitalsPage';
import { MedicationsPage } from './views/MedicationsPage';
import { DocumentsPage } from './views/DocumentsPage';
import { HealthSummaryPage } from './views/HealthSummaryPage';
import { AppointmentsPage } from './views/AppointmentsPage';
import { ConsentAccessPage } from './views/ConsentAccessPage';
import { SettingsPage } from './views/SettingsPage';
import { DoctorPortalPage } from './views/DoctorPortalPage';
import { AdminConsolePage } from './views/AdminConsolePage';
import { LoginPage } from './views/LoginPage';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PatientDataProvider } from './context/PatientDataContext';

// ---- Protected Route Guard ----
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading MedTwin...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to role-appropriate home
    if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// ---- Doctor/Admin standalone layouts ----
const DoctorLayout: React.FC = () => {
  const { logout, user } = useAuth();
  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">biotech</span>
          </div>
          <span className="font-bold text-white">MedTwin</span>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold">DOCTOR</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{user?.name}</span>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[16px]">logout</span>Sign Out
          </button>
        </div>
      </div>
      <DoctorPortalPage />
    </div>
  );
};

const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">admin_panel_settings</span>
          </div>
          <span className="font-bold text-white">MedTwin</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{user?.name}</span>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[16px]">logout</span>Sign Out
          </button>
        </div>
      </div>
      <AdminConsolePage />
    </div>
  );
};

// ---- Patient App Layout ----
const AppLayout: React.FC = () => {
  const location = useLocation();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const isOrganDetail = location.pathname.startsWith('/organ/');

  if (isOrganDetail) {
    return (
      <div className="min-h-screen w-full bg-[#070B14] flex flex-col font-sans">
        <Routes>
          <Route path="/organ/:organId" element={<OrganDetailDark />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F6F8FB] text-slate-900 flex flex-col lg:flex-row antialiased font-sans">
      <div className="hidden lg:block">
        <Sidebar
          onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <Header
          onOpenNotifications={() => {}}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<DesktopDashboard />} />
            <Route path="/dashboard" element={<DesktopDashboard />} />
            <Route path="/digital-twin" element={<DigitalTwinFullPage />} />
            <Route path="/vitals" element={<VitalsPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/health-summary" element={<HealthSummaryPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/consent" element={<ConsentAccessPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/voice-assistant" element={<DesktopDashboard />} />
            <Route path="/profile" element={<DesktopDashboard />} />
          </Routes>
        </main>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around z-40 shadow-lg">
          <MobileBottomBar
            onOpenVoice={() => setIsVoiceModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        </div>
      </div>

      <VoiceAssistantModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
};

const MobileBottomBar: React.FC<{ onOpenVoice: () => void; onOpenProfile: () => void }> = ({ onOpenVoice }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { label: 'Dashboard', icon: 'grid_view', path: '/' },
    { label: 'Twin', icon: 'accessibility_new', path: '/digital-twin' },
    { label: 'Vitals', icon: 'favorite_border', path: '/vitals' },
    { label: 'Meds', icon: 'medication', path: '/medications' },
    { label: 'Voice', icon: 'mic', isAction: true },
  ];
  return (
    <>
      {tabs.map((tab) => {
        const isActive = tab.path === '/' ? location.pathname === '/' : tab.path && location.pathname.startsWith(tab.path);
        if (tab.isAction) {
          return (
            <button key={tab.label} onClick={onOpenVoice} className="flex flex-col items-center gap-0.5 text-blue-600 font-bold">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <span className="material-symbols-outlined text-[18px]">mic</span>
              </div>
              <span className="text-[10px]">Voice</span>
            </button>
          );
        }
        return (
          <button key={tab.label} onClick={() => tab.path && navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </>
  );
};

// ---- Root App with Routing ----
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Doctor Portal */}
          <Route path="/doctor/*" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorLayout />
            </ProtectedRoute>
          } />

          {/* Admin Console */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          } />

          {/* Patient App — all routes wrapped with PatientDataProvider */}
          <Route path="/*" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDataProvider>
                <AppLayout />
              </PatientDataProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
