import React from 'react';
import { OrganSelector, OrganSelectorItem } from './OrganSelector';
import { OrganImage } from './OrganImage';
import { Box, Eye, ZoomIn, Move } from 'lucide-react';

interface DigitalTwinHeroProps {
  onSelectOrgan: (organSlug: string) => void;
  selectedOrgan?: string;
  variant?: 'light' | 'dark';
}

export const DigitalTwinHero: React.FC<DigitalTwinHeroProps> = ({
  onSelectOrgan,
  selectedOrgan = 'heart',
  variant = 'light',
}) => {
  const leftOrgans: OrganSelectorItem[] = [
    { id: 'brain', name: 'Brain', status: 'Healthy', iconType: 'brain' },
    { id: 'lungs', name: 'Lungs', status: 'Good', iconType: 'lungs' },
    { id: 'heart', name: 'Heart', status: 'Stable', iconType: 'heart' },
    { id: 'liver', name: 'Liver', status: 'Normal', iconType: 'liver' },
    { id: 'stomach', name: 'Stomach', status: 'Good', iconType: 'stomach' },
  ];

  const rightOrgans: OrganSelectorItem[] = [
    { id: 'kidneys', name: 'Kidneys', status: 'Normal', iconType: 'kidneys' },
    { id: 'bladder', name: 'Bladder', status: 'Normal', iconType: 'bladder' },
    { id: 'muscles', name: 'Muscles', status: 'Good', iconType: 'muscles' },
    { id: 'bones', name: 'Bones', status: 'Strong', iconType: 'bones' },
    { id: 'skin', name: 'Skin', status: 'Healthy', iconType: 'skin' },
  ];

  return (
    <div
      className={`relative w-full rounded-3xl p-4 sm:p-6 transition-all ${
        variant === 'dark' ? 'bg-slate-950/60 text-white' : 'bg-transparent text-slate-800'
      }`}
    >
      {/* Title & Live Status (No Vascular / Muscular / Skeletal buttons) */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Digital Twin Overview
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live • Synced just now</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Organs, Center Body, Right Organs */}
      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center min-h-[420px] lg:min-h-[480px]">
        {/* Left Column Organ Selectors */}
        <div className="col-span-3 hidden md:flex flex-col gap-2.5 z-10">
          {leftOrgans.map((item) => (
            <OrganSelector
              key={item.id}
              item={item}
              isActive={selectedOrgan === item.id}
              onClick={() => onSelectOrgan(item.id)}
              variant={variant}
            />
          ))}
        </div>

        {/* Center: Anatomical Body with Holographic Pedestal */}
        <div className="col-span-12 md:col-span-6 relative flex flex-col items-center justify-center py-4">
          {/* Holographic Glowing Concentric Rings Pedestal */}
          <div className="absolute bottom-4 w-52 sm:w-64 h-16 sm:h-20 pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 rounded-[100%] bg-blue-500/10 blur-xl animate-pulse" />
            <div className="w-full h-full rounded-[100%] border border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] transform scale-y-50" />
            <div className="absolute w-3/4 h-3/4 rounded-[100%] border border-cyan-300/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] transform scale-y-50" />
            <div className="absolute w-1/2 h-1/2 rounded-[100%] border border-blue-200/80 transform scale-y-50" />
            {/* Ambient Vertical Light Beam */}
            <div className="absolute -top-40 w-36 h-48 bg-gradient-to-t from-blue-400/15 via-cyan-400/5 to-transparent blur-md pointer-events-none" />
          </div>

          {/* Central Body Visual - Pure transparent anatomical figure with subtle float */}
          <div className="relative w-56 sm:w-64 md:w-72 lg:w-80 h-[380px] sm:h-[420px] lg:h-[450px] flex items-center justify-center">
            <OrganImage
              organ="body"
              size="full"
              floating={true}
              className="drop-shadow-[0_10px_25px_rgba(37,99,235,0.2)]"
            />

            {/* Clickable anatomical organ markers / glowing hotspots */}
            <button
              onClick={() => onSelectOrgan('brain')}
              className="absolute top-[8%] left-[49%] -translate-x-1/2 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400/80 flex items-center justify-center group cursor-pointer shadow-lg hover:scale-125 transition-transform z-20"
              title="Inspect Brain"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            </button>

            <button
              onClick={() => onSelectOrgan('heart')}
              className="absolute top-[27%] left-[53%] -translate-x-1/2 w-7 h-7 rounded-full bg-rose-500/25 border-2 border-rose-400 flex items-center justify-center group cursor-pointer shadow-lg shadow-rose-500/40 hover:scale-125 transition-transform z-20"
              title="Inspect Heart"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-rose-400 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            </button>

            <button
              onClick={() => onSelectOrgan('lungs')}
              className="absolute top-[25%] left-[40%] -translate-x-1/2 w-6 h-6 rounded-full bg-sky-500/20 border border-sky-400/80 flex items-center justify-center group cursor-pointer shadow-lg hover:scale-125 transition-transform z-20"
              title="Inspect Lungs"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
            </button>

            <button
              onClick={() => onSelectOrgan('liver')}
              className="absolute top-[37%] left-[43%] -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/80 flex items-center justify-center group cursor-pointer shadow-lg hover:scale-125 transition-transform z-20"
              title="Inspect Liver"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </button>

            <button
              onClick={() => onSelectOrgan('kidneys')}
              className="absolute top-[42%] left-[56%] -translate-x-1/2 w-6 h-6 rounded-full bg-red-500/20 border border-red-400/80 flex items-center justify-center group cursor-pointer shadow-lg hover:scale-125 transition-transform z-20"
              title="Inspect Kidneys"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>

          {/* View in 3D Action Pill */}
          <div className="mt-2 flex items-center gap-3 z-10">
            <button
              onClick={() => onSelectOrgan(selectedOrgan || 'heart')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-md shadow-slate-900/20 transition-all cursor-pointer hover:scale-105"
            >
              <Box className="w-3.5 h-3.5 text-blue-400" />
              <span>View in 3D</span>
            </button>
          </div>
        </div>

        {/* Right Column Organ Selectors */}
        <div className="col-span-3 hidden md:flex flex-col gap-2.5 z-10">
          {rightOrgans.map((item) => (
            <OrganSelector
              key={item.id}
              item={item}
              isActive={selectedOrgan === item.id}
              onClick={() => onSelectOrgan(item.id)}
              align="right"
              variant={variant}
            />
          ))}
        </div>
      </div>

      {/* Mobile Organ Scroll Carousel for small screens */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {[...leftOrgans, ...rightOrgans].map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectOrgan(item.id)}
            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              selectedOrgan === item.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <span>{item.name}</span>
            <span className="text-[10px] opacity-80">({item.status})</span>
          </button>
        ))}
      </div>

      {/* Footer Navigation Hints */}
      <div className="mt-3 hidden sm:flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium border-t border-slate-100/80 pt-3">
        <span className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
          <Move className="w-3.5 h-3.5" /> Drag to rotate
        </span>
        <span className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
          <ZoomIn className="w-3.5 h-3.5" /> Scroll to zoom
        </span>
        <span className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
          <Eye className="w-3.5 h-3.5" /> Click organ for details
        </span>
        <span
          className="flex items-center gap-1.5 text-blue-600 font-semibold cursor-pointer"
          onClick={() => onSelectOrgan('heart')}
        >
          <Box className="w-3.5 h-3.5" /> 3D
        </span>
      </div>
    </div>
  );
};
