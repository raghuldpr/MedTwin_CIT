import React, { useState } from 'react';
import { VitalMetric } from '../types';
import { ECGChart } from './ECGChart';
import { Heart, Activity, Droplet, Zap, Wind, Thermometer, ArrowUpRight, TrendingDown, TrendingUp, Filter } from 'lucide-react';

interface VitalsViewProps {
  vitals: VitalMetric[];
}

export const VitalsView: React.FC<VitalsViewProps> = ({ vitals }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-blue-500" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-emerald-500" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-purple-500" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-sky-500" />;
      case 'Thermometer':
        return <Thermometer className="w-5 h-5 text-amber-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Physiological Biomarkers & Vitals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous real-time biometric telemetry streaming from wearable and clinical sensors
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs font-semibold">
          {(['24h', '7d', '30d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedTimeframe === tf
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Detailed Vital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vitals.map((vital) => (
          <div
            key={vital.id}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {getIcon(vital.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{vital.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Updated just now</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                  {vital.status}
                </span>
              </div>

              {/* Value & Normal Range */}
              <div className="flex items-baseline justify-between mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {vital.value}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {vital.unit}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Target: <span className="text-slate-600 font-semibold">{vital.normalRange}</span>
                </div>
              </div>

              {/* Mini Trend text */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>{vital.trend}</span>
              </div>
            </div>

            {/* Live Chart Stream */}
            <div className="mt-4 pt-3 border-t border-slate-50">
              <div className="h-16 rounded-xl bg-slate-50/70 p-1 flex items-center justify-center overflow-hidden">
                <ECGChart
                  type={vital.id === 'heart-rate' ? 'ecg' : vital.id === 'spo2' ? 'spo2' : 'linear'}
                  height={50}
                  color={vital.color}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
