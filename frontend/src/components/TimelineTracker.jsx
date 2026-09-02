import React from 'react';
import { 
  Check, 
  Clock, 
  Scale, 
  FlaskConical, 
  CheckCircle2, 
  CreditCard, 
  CheckCheck, 
  XCircle,
  FileText
} from 'lucide-react';

const STAGES = [
  { key: 'REGISTERED', label: 'Registered', icon: FileText, desc: 'Slot & Token Generated' },
  { key: 'WAITING', label: 'Waiting', icon: Clock, desc: 'In Centre Queue' },
  { key: 'WEIGHING', label: 'Weighing', icon: Scale, desc: 'Gross & Tare Weighbridge' },
  { key: 'QUALITY_CHECK', label: 'Quality Check', icon: FlaskConical, desc: 'Moisture & Grade Lab' },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2, desc: 'FAQ Purity Certified' },
  { key: 'PAYMENT_PENDING', label: 'Payment Pending', icon: CreditCard, desc: 'PFMS DBT Advice' },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCheck, desc: 'MSP Payout Transferred' }
];

export default function TimelineTracker({ status, statusHistory = [] }) {
  const isRejected = status === 'REJECTED';
  
  // Find current active index in STAGES
  let currentIdx = STAGES.findIndex(s => s.key === status);
  if (currentIdx === -1 && !isRejected) {
    currentIdx = 0;
  }

  // Map history events by to_status for easy tooltip / timestamp lookup
  const historyMap = {};
  statusHistory.forEach(h => {
    historyMap[h.to_status] = h;
  });

  return (
    <div className="w-full bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-card">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Procurement Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking from entry to bank payout</p>
        </div>
        {isRejected ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Quality Inspection Rejected
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Stage {Math.min(currentIdx + 1, 7)} of 7
          </span>
        )}
      </div>

      {/* Desktop / Tablet Horizontal Timeline */}
      <div className="hidden lg:block relative my-4">
        {/* Connection Bar */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 rounded-full z-0">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${isRejected ? 'bg-rose-400' : 'bg-emerald-500'}`}
            style={{ width: isRejected ? '60%' : `${(currentIdx / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative z-10 grid grid-cols-7 gap-2">
          {STAGES.map((stage, idx) => {
            const isPast = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;
            const history = historyMap[stage.key];
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-xs shadow-sm ${
                    isPast
                      ? 'bg-emerald-600 text-white shadow-emerald-200'
                      : isCurrent
                      ? isRejected
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                        : 'bg-white border-2 border-emerald-600 text-emerald-700 ring-4 ring-emerald-100 shadow-md scale-110'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isPast ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="mt-3">
                  <span className={`text-xs font-bold block ${isCurrent ? 'text-emerald-800' : isPast ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 max-w-[100px]">
                    {stage.desc}
                  </span>
                  {history && (
                    <span className="text-[9px] text-emerald-600 font-medium block mt-1">
                      {new Date(history.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="block lg:hidden space-y-4">
        {STAGES.map((stage, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const history = historyMap[stage.key];
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isPast
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isPast ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`w-0.5 h-6 my-1 ${isPast ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </div>

              <div className="pt-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-emerald-800 font-extrabold' : isPast ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stage.label}
                  </span>
                  {history && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(history.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{stage.desc}</p>
                {history?.remarks && (
                  <p className="text-[10px] text-emerald-700 bg-emerald-50/70 p-1.5 rounded mt-1 border border-emerald-100">
                    {history.remarks}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejection notice if applicable */}
      {isRejected && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Consignment Rejected at Quality Testing</span>
            <span className="text-rose-700">Please consult the mandi quality lab officer or refer to FAQ standards advisory before re-booking.</span>
          </div>
        </div>
      )}
    </div>
  );
}
