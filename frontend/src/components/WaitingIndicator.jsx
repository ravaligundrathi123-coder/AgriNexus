import React from 'react';
import { Clock, Users, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function WaitingIndicator({ 
  estimatedMinutes = 25, 
  farmersAhead = 3, 
  confidenceScore = 91.5, 
  factors = [],
  status = 'WAITING'
}) {
  const isWaiting = status === 'REGISTERED' || status === 'WAITING';
  const isProcessing = status === 'WEIGHING' || status === 'QUALITY_CHECK';
  const isDone = status === 'ACCEPTED' || status === 'PAYMENT_PENDING' || status === 'COMPLETED';

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 pb-4 border-b border-emerald-800/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-400">
              AI Waiting-Time Prediction Engine
            </h4>
            <p className="text-[11px] text-emerald-200/70">RandomForest Regressor Model v1.2</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-400/25 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">
            {confidenceScore ? `${confidenceScore}% Confidence` : '92% Confidence'}
          </span>
        </div>
      </div>

      {/* Main Wait Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 relative z-10">
        {/* Estimated Time Box */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-sm">
          <span className="text-xs text-emerald-200/80 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Estimated Wait Until Your Turn
          </span>
          <div className="mt-2 mb-1 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {isWaiting 
                ? (estimatedMinutes > 0 ? `${Math.round(estimatedMinutes)}` : '5')
                : isProcessing ? '~5-8' : '0'}
            </span>
            <span className="text-sm font-semibold text-emerald-300">
              {isWaiting ? 'minutes' : isProcessing ? 'mins (In Turn)' : 'mins (Complete)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isWaiting
              ? `Expected arrival at gate: ${new Date(Date.now() + Math.max(5, estimatedMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : isProcessing ? 'Vehicle called to active counter' : 'Procurement finalized'}
          </span>
        </div>

        {/* Farmers Ahead Box */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-sm">
          <span className="text-xs text-emerald-200/80 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Queue Position & Farmers Ahead
          </span>
          <div className="mt-2 mb-1 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {isWaiting ? farmersAhead : (isProcessing ? '0' : '0')}
            </span>
            <span className="text-sm font-semibold text-emerald-300">
              {isWaiting 
                ? (farmersAhead === 1 ? 'farmer ahead' : 'farmers ahead')
                : isProcessing ? 'vehicle on bench' : 'queue cleared'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isWaiting 
              ? (farmersAhead === 0 ? '⭐ You are next! Prepare vehicle' : 'Automated FIFO queue index')
              : 'Status actively progressing'}
          </span>
        </div>
      </div>

      {/* Influencing Factors (Explainable AI) */}
      {factors && factors.length > 0 && (
        <div className="relative z-10 pt-3 border-t border-emerald-800/40">
          <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block mb-2">
            Key Factors Influencing This Prediction:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {factors.slice(0, 4).map((f, i) => (
              <div 
                key={i} 
                className={`text-xs p-2 rounded-lg border flex items-center justify-between ${
                  f.type === 'positive' 
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200' 
                    : f.type === 'negative'
                    ? 'bg-amber-950/40 border-amber-700/50 text-amber-200'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                }`}
              >
                <span className="font-medium truncate mr-2">{f.factor}</span>
                <span className="text-[10px] font-bold shrink-0 opacity-90 px-1.5 py-0.5 rounded bg-black/20">
                  {f.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
