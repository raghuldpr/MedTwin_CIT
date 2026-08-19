import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, ChevronRight, X, Heart, Activity, ShieldCheck, RefreshCw } from 'lucide-react';

interface AIHealthSummaryProps {
  onViewFullReport?: () => void;
}

export const AIHealthSummary: React.FC<AIHealthSummaryProps> = ({
  onViewFullReport,
}) => {
  const [showFullModal, setShowFullModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
        {/* Subtle decorative gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">AI Health Summary</h3>
              <span className="text-[11px] text-slate-400">Generated just now</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            title="Regenerate Summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        {/* Summary text exactly matching reference */}
        <p className="text-xs text-slate-600 leading-relaxed mt-2 mb-4">
          Your overall health indicators are within normal ranges. Continue maintaining your current lifestyle. Focus on hydration and regular exercise.
        </p>

        {/* Action Button */}
        <button
          onClick={() => {
            setShowFullModal(true);
            onViewFullReport?.();
          }}
          className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-2xl text-xs font-semibold border border-slate-200/60 hover:border-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
        >
          <span>View Full Summary</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Full AI Clinical Report Modal */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">MedTwin AI Clinical Assessment</h3>
                  <p className="text-xs text-slate-500">Comprehensive multi-system digital twin synthesis</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Primary Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-950 text-xs">Optimal Physiological Stability</h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Digital twin biomarker metrics across cardiovascular, neurological, pulmonary, and renal systems are currently operating within target therapeutic bounds.
                  </p>
                </div>
              </div>

              {/* Organ Systems Assessment */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Organ Systems Synthesis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-semibold text-slate-900">Cardiovascular</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Heart rate stable at 78 bpm. Normal sinus rhythm with optimal stroke volume (5.2 L/min).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold text-slate-900">Respiratory & SpO₂</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Oxygen saturation at 98%. Respiratory rate 16 rpm indicates calm, regular pulmonary function.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-semibold text-slate-900">Renal & Metabolic</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Blood glucose at 116 mg/dL. Glomerular filtration rate (102 mL/min) demonstrates strong clearance.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-900">Lifestyle & Recovery</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sleep quality is optimal. Stress indices remain low. Fluid hydration levels are balanced.
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinical Recommendations */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <h4 className="text-xs font-bold text-blue-950 mb-2">Personalized Recommendations</h4>
                <ul className="space-y-1.5 text-xs text-blue-900">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Take Amlodipine 5mg at 08:00 AM as scheduled.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Target 2.5 Liters of water throughout the afternoon.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Recommended 30-minute moderate aerobic walk this evening.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowFullModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
