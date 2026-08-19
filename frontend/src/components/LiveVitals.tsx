import React from 'react';
import { Heart, Activity, Droplet, Zap, Wind, Thermometer } from 'lucide-react';
import { VitalMetric } from '../types';

interface LiveVitalsProps {
  vitals: VitalMetric[];
  onViewAll?: () => void;
  onSelectVital?: (vitalId: string) => void;
}

export const LiveVitals: React.FC<LiveVitalsProps> = ({
  vitals,
  onViewAll,
  onSelectVital,
}) => {
  const getIcon = (iconName: string, color: string) => {
    const iconClass = "w-4 h-4";
    switch (iconName) {
      case 'Heart':
        return <Heart className={`${iconClass} text-rose-500 fill-rose-500/20`} />;
      case 'Activity':
        return <Activity className={`${iconClass} text-blue-500`} />;
      case 'Droplet':
        return <Droplet className={`${iconClass} text-emerald-500 fill-emerald-500/20`} />;
      case 'Zap':
        return <Zap className={`${iconClass} text-purple-500 fill-purple-500/20`} />;
      case 'Wind':
        return <Wind className={`${iconClass} text-sky-500`} />;
      case 'Thermometer':
        return <Thermometer className={`${iconClass} text-amber-500`} />;
      default:
        return <Activity className={`${iconClass} text-blue-500`} />;
    }
  };

  const getMiniWaveform = (type: string, color: string) => {
    let path = "M 0 10 Q 15 2, 30 10 T 60 10 T 90 2 T 120 10";
    let strokeColor = "#3b82f6";

    if (type === 'heart-rate') {
      path = "M 0 12 L 20 12 L 25 2 L 32 20 L 38 12 L 50 12 L 70 12 L 75 2 L 82 20 L 88 12 L 120 12";
      strokeColor = "#f43f5e";
    } else if (type === 'spo2') {
      path = "M 0 10 Q 20 5, 40 10 T 80 10 T 120 10";
      strokeColor = "#10b981";
    } else if (type === 'glucose') {
      path = "M 0 10 L 30 10 L 45 4 L 60 14 L 75 10 L 120 10";
      strokeColor = "#8b5cf6";
    }

    return (
      <svg viewBox="0 0 120 20" className="w-full h-4 mt-1 opacity-80" fill="none">
        <path d={path} stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const mainVitals = vitals.slice(0, 4);
  const secondaryVitals = vitals.slice(4, 6);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Live Vitals</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* 2x2 Main Vitals Grid */}
      <div className="grid grid-cols-2 gap-3">
        {mainVitals.map((vital) => (
          <div
            key={vital.id}
            onClick={() => onSelectVital?.(vital.id)}
            className="group bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer hover:border-blue-100"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                {getIcon(vital.iconName, vital.color)}
                {vital.name}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                {vital.value}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {vital.unit}
              </span>
            </div>

            {/* Mini Waveform */}
            {getMiniWaveform(vital.id, vital.color)}
          </div>
        ))}
      </div>

      {/* Bottom 2 Secondary Vitals */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {secondaryVitals.map((vital) => (
          <div
            key={vital.id}
            className="bg-white rounded-2xl p-2.5 px-3 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                {getIcon(vital.iconName, vital.color)}
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">{vital.name}</div>
                <div className="text-sm font-bold text-slate-900">
                  {vital.value} <span className="text-[10px] font-normal text-slate-400">{vital.unit}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
