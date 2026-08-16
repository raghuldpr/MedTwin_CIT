import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DigitalTwinViewer } from '../components/DigitalTwinViewer';
import { organsData } from '../data/mockData';
import { OrganId } from '../types';
import { usePatientData } from '../context/PatientDataContext';

const ORGAN_SYSTEM_MAP: Record<string, OrganId> = {
  CARDIOVASCULAR: 'heart',
  RESPIRATORY: 'lungs',
  NERVOUS: 'brain',
  DIGESTIVE: 'stomach',
  RENAL: 'kidneys',
  HEPATIC: 'liver',
  MUSCULOSKELETAL: 'muscles',
  ENDOCRINE: 'skin',
  IMMUNE: 'bones',
  REPRODUCTIVE: 'bladder',
};

export const DigitalTwinFullPage: React.FC = () => {
  const navigate = useNavigate();
  const { organs, isLoading, error, reload } = usePatientData();
  const [selectedOrgan, setSelectedOrgan] = useState<OrganId>('heart');

  const organKeys: OrganId[] = ['brain', 'lungs', 'heart', 'liver', 'stomach', 'kidneys', 'bladder', 'muscles', 'bones', 'skin'];

  const getStatusForOrgan = (id: OrganId) => {
    const sysKey = Object.entries(ORGAN_SYSTEM_MAP).find(([, v]) => v === id)?.[0];
    const organObj = organs.find((o) => o.system === sysKey);
    return organObj ? organObj.status.charAt(0) + organObj.status.slice(1).toLowerCase() : organsData[id]?.status || 'Normal';
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading 3D Digital Twin model...</p>
        </div>
      </div>
    );
  }

  if (error && organs.length === 0) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="material-symbols-outlined text-rose-400 text-[48px]">cloud_off</span>
        <p className="text-slate-800 font-bold">Failed to Load Digital Twin Data</p>
        <p className="text-slate-500 text-sm">{error}</p>
        <button onClick={reload} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">3D Anatomical Digital Twin</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-body interactive multi-layer biomechanical digital twin model
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/organ/${selectedOrgan}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Inspect {organsData[selectedOrgan]?.name || 'Organ'}
          </button>
        </div>
      </div>

      {/* Main 3D Stage & Organ Selector Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
        {/* Left Organ List */}
        <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {organKeys.slice(0, 5).map((id) => {
            const organ = organsData[id];
            if (!organ) return null;
            const isSelected = selectedOrgan === id;
            const status = getStatusForOrgan(id);
            return (
              <div
                key={id}
                onClick={() => setSelectedOrgan(id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-w-[140px] ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">
                    {id === 'heart' ? 'favorite' : id === 'brain' ? 'psychology' : id === 'lungs' ? 'pulmonology' : 'medication_liquid'}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block leading-tight">{organ.name}</span>
                    <span className={`text-[10px] font-semibold ${status === 'Monitor' ? 'text-amber-500' : status === 'Abnormal' ? 'text-rose-500' : 'text-emerald-500'}`}>{status}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/organ/${id}`);
                  }}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  Inspect →
                </button>
              </div>
            );
          })}
        </div>

        {/* Center 3D Digital Twin Viewer Canvas */}
        <div className="lg:col-span-6 bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[500px] relative">
          <DigitalTwinViewer
            selectedOrgan={selectedOrgan}
            onSelectOrgan={(id) => setSelectedOrgan(id)}
            showControls={true}
          />
        </div>

        {/* Right Organ List */}
        <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {organKeys.slice(5).map((id) => {
            const organ = organsData[id];
            if (!organ) return null;
            const isSelected = selectedOrgan === id;
            const status = getStatusForOrgan(id);
            return (
              <div
                key={id}
                onClick={() => setSelectedOrgan(id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-w-[140px] ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">
                    {id === 'kidneys' ? 'nephrology' : id === 'bladder' ? 'water_drop' : id === 'muscles' ? 'fitness_center' : 'accessibility'}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block leading-tight">{organ.name}</span>
                    <span className={`text-[10px] font-semibold ${status === 'Monitor' ? 'text-amber-500' : status === 'Abnormal' ? 'text-rose-500' : 'text-emerald-500'}`}>{status}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/organ/${id}`);
                  }}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  Inspect →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
