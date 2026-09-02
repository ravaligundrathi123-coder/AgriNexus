import React from 'react';
import { AlertTriangle, CheckCircle, Zap, ArrowUpRight, Wrench } from 'lucide-react';

export default function BottleneckAlert({ bottleneck }) {
  if (!bottleneck) return null;

  const { is_bottleneck, bottleneck_stage, alert_title, alert_description, recommendation, estimated_reduction_percentage, avg_stage_times } = bottleneck;

  return (
    <div className={`rounded-2xl p-5 md:p-6 border transition-all shadow-card ${
      is_bottleneck 
        ? 'bg-amber-50/70 border-amber-200' 
        : 'bg-emerald-50/70 border-emerald-200'
    }`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-amber-200/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            is_bottleneck ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-emerald-600 text-white'
          }`}>
            {is_bottleneck ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                is_bottleneck ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-200/80 text-emerald-900'
              }`}>
                AI Mandi Bottleneck Engine
              </span>
              {is_bottleneck && (
                <span className="text-xs font-bold text-amber-700">
                  Critical Delay: {bottleneck_stage}
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">{alert_title}</h4>
          </div>
        </div>

        {is_bottleneck && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100/80 text-amber-900 rounded-xl text-xs font-bold border border-amber-300/60">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Potential wait reduction: -{estimated_reduction_percentage}%</span>
          </div>
        )}
      </div>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="md:col-span-2">
          <p className="text-slate-700 leading-relaxed font-medium mb-3">
            {alert_description}
          </p>
          <div className="p-3 bg-white rounded-xl border border-amber-200/70 flex items-start gap-2.5">
            <Wrench className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">Recommended Action:</span>
              <span className="text-slate-600">{recommendation}</span>
            </div>
          </div>
        </div>

        {/* Stage Comparison Mini-Metric */}
        {avg_stage_times && (
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="font-bold text-slate-700 block mb-2">Stage Durations (Avg)</span>
            <div className="space-y-1.5">
              {Object.entries(avg_stage_times).map(([stage, mins]) => (
                <div key={stage} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{stage}:</span>
                  <span className={`font-bold ${mins > 18 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {mins} mins
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
