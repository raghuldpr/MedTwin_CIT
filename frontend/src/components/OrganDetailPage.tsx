import React, { useState } from 'react';
import { OrganDetail } from '../types';
import { OrganImage } from './OrganImage';
import { ECGChart } from './ECGChart';
import {
  ArrowLeft,
  Activity,
  Heart,
  Brain,
  Wind,
  ShieldCheck,
  Flame,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface OrganDetailPageProps {
  organ: OrganDetail;
  onBack: () => void;
  onSelectOrgan: (organSlug: string) => void;
}

export const OrganDetailPage: React.FC<OrganDetailPageProps> = ({
  organ,
  onBack,
  onSelectOrgan,
}) => {
  const [activeTimeline, setActiveTimeline] = useState<'Live' | '24h'>('Live');

  const organList = [
    { slug: 'brain', icon: Brain, label: 'Brain' },
    { slug: 'lungs', icon: Wind, label: 'Lungs' },
    { slug: 'heart', icon: Heart, label: 'Heart' },
    { slug: 'liver', icon: Activity, label: 'Liver' },
    { slug: 'kidneys', icon: Activity, label: 'Kidneys' },
    { slug: 'stomach', icon: Flame, label: 'Stomach' },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-12">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800/80">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{organ.name}</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Status: {organ.status}</span>
        </div>
      </div>

      {/* Main Studio Viewport Grid */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Vertical Organ Navigation */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center gap-3 pt-2">
          {organList.map((item) => {
            const Icon = item.icon;
            const isActive = organ.slug === item.slug;
            return (
              <button
                key={item.slug}
                onClick={() => onSelectOrgan(item.slug)}
                title={item.label}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-400/40'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Center: Large Organ Image floating naturally against dark background */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[480px] sm:min-h-[540px] rounded-3xl bg-radial from-slate-900/50 via-slate-950 to-[#070b14] border border-slate-800/60 p-6 overflow-hidden">
          {/* Ambient Lighting Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Center Floating High-Quality Organ Asset */}
          <div className="relative flex items-center justify-center py-6">
            <OrganImage
              organ={organ.slug}
              size="hero"
              floating={true}
              pulse={organ.slug === 'heart'}
              className="drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            />
          </div>

          {/* Bottom/Around Organ: Heart Rate Card & Live Waveform */}
          <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl z-10 min-w-[190px]">
            <div className="text-xs text-slate-400 font-medium">{organ.primaryMetric.label}</div>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5 flex items-baseline gap-1.5">
              {organ.primaryMetric.value}
            </div>
            {/* Live waveform */}
            <div className="w-36 h-6 mt-1.5">
              <ECGChart type={organ.waveformType} height={24} color="#f43f5e" />
            </div>
          </div>

          {/* Bottom/Around Organ: Blood Flow / Physiological State Card */}
          <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl z-10 min-w-[170px]">
            <div className="text-xs text-slate-400 font-medium">Blood Flow</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{organ.primaryMetric.statusText || 'Normal'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Overview, Today's Timeline, Health Indicators, Back Button */}
        <div className="lg:col-span-5 space-y-4">
          {/* Organ Overview Card */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white tracking-tight">{organ.name} Overview</h3>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {organ.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {organ.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0"
                >
                  <span className="text-slate-400">{metric.label}</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-100">{metric.value}</span>
                    {metric.range && (
                      <span className="block text-[10px] text-slate-500">Target: {metric.range}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Timeline */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white tracking-tight">Today's Timeline</h4>
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg text-xs">
                {(['Live', '24h'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTimeline(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      activeTimeline === t ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ECG / Organ Waveform */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/90 p-2 overflow-hidden">
              <ECGChart
                type={organ.waveformType}
                height={75}
                color={organ.slug === 'heart' ? '#f43f5e' : organ.slug === 'lungs' ? '#38bdf8' : '#818cf8'}
              />
            </div>
          </div>

          {/* Health Indicators */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xs">
            <h4 className="text-sm font-bold text-white tracking-tight mb-3">
              {organ.name} Health Indicators
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {organ.keyIndicators.map((ind, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">{ind.label}</div>
                  <div className="text-sm font-bold text-slate-100 mt-1 flex items-center justify-between">
                    <span>{ind.value}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Back to Digital Twin Button */}
          <button
            onClick={onBack}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Digital Twin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
