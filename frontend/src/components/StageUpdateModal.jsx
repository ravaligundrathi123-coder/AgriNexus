import React, { useState } from 'react';
import { X, Scale, FlaskConical, CheckCircle2, XCircle, CreditCard, CheckCheck, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function StageUpdateModal({ procurement, onClose, onSuccess }) {
  if (!procurement) return null;

  const [loading, setLoading] = useState(false);
  const [targetStatus, setTargetStatus] = useState(getNextRecommendedStatus(procurement.status));
  const [counterNumber, setCounterNumber] = useState('Weighbridge 1');
  const [grossWeight, setGrossWeight] = useState(procurement.gross_weight || (procurement.estimated_quantity + 18.2).toFixed(1));
  const [tareWeight, setTareWeight] = useState(procurement.tare_weight || '18.2');
  const [moisture, setMoisture] = useState(procurement.moisture_percentage || '12.6');
  const [foreignMatter, setForeignMatter] = useState(procurement.foreign_matter_percentage || '0.7');
  const [grade, setGrade] = useState(procurement.grade || 'Grade A');
  const [rejectionReason, setRejectionReason] = useState('Moisture content exceeds permissible standard of 17.0%.');
  const [remarks, setRemarks] = useState('');

  const netWeight = Math.max(0, (parseFloat(grossWeight || 0) - parseFloat(tareWeight || 0)).toFixed(2));

  function getNextRecommendedStatus(current) {
    switch (current) {
      case 'REGISTERED':
      case 'WAITING':
        return 'WEIGHING';
      case 'WEIGHING':
        return 'QUALITY_CHECK';
      case 'QUALITY_CHECK':
        return 'ACCEPTED';
      case 'ACCEPTED':
        return 'PAYMENT_PENDING';
      case 'PAYMENT_PENDING':
        return 'COMPLETED';
      default:
        return 'COMPLETED';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        to_status: targetStatus,
        remarks: remarks || `Advanced to ${targetStatus} by officer`,
        counter_number: counterNumber,
      };

      if (targetStatus === 'QUALITY_CHECK' || targetStatus === 'ACCEPTED' || targetStatus === 'PAYMENT_PENDING' || targetStatus === 'COMPLETED') {
        payload.gross_weight = parseFloat(grossWeight);
        payload.tare_weight = parseFloat(tareWeight);
        payload.net_weight = parseFloat(netWeight);
      }

      if (targetStatus === 'ACCEPTED') {
        payload.grade = grade;
        payload.moisture_percentage = parseFloat(moisture);
        payload.foreign_matter_percentage = parseFloat(foreignMatter);
      }

      if (targetStatus === 'REJECTED') {
        payload.rejection_reason = rejectionReason;
        payload.moisture_percentage = parseFloat(moisture);
      }

      await api.patch(`/procurements/${procurement.id}/stage`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update procurement stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Procurement Officer Action
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              Update Stage: {procurement.token_number}
            </h3>
            <p className="text-xs text-slate-500">
              Farmer: {procurement.farmer_name} | {procurement.crop_type} ({procurement.estimated_quantity} Qtl)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Status Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Advance To Next Stage
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'WEIGHING', label: '1. Weighing', icon: Scale },
                { key: 'QUALITY_CHECK', label: '2. Quality Check', icon: FlaskConical },
                { key: 'ACCEPTED', label: '3. Accept Consignment', icon: CheckCircle2 },
                { key: 'PAYMENT_PENDING', label: '4. Payment Pending', icon: CreditCard },
                { key: 'COMPLETED', label: '5. Mark Completed', icon: CheckCheck },
                { key: 'REJECTED', label: 'Reject Consignment', icon: XCircle, danger: true },
              ].map((st) => (
                <button
                  type="button"
                  key={st.key}
                  onClick={() => setTargetStatus(st.key)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                    targetStatus === st.key
                      ? st.danger
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <st.icon className="w-4 h-4 shrink-0" />
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Counter / Location Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Assigned Counter / Lab
            </label>
            <select
              value={counterNumber}
              onChange={(e) => setCounterNumber(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Weighbridge 1">Weighbridge #1 (Heavy Load)</option>
              <option value="Weighbridge 2">Weighbridge #2 (Tractor Trolley)</option>
              <option value="Quality Lab 1">Quality Testing Lab #1</option>
              <option value="Quality Lab 2">Quality Testing Lab #2 (Express Moisture)</option>
              <option value="Disbursement Desk 1">PFMS / DBT Settlement Counter</option>
            </select>
          </div>

          {/* Stage Specific Fields */}
          {(targetStatus === 'WEIGHING' || targetStatus === 'QUALITY_CHECK' || targetStatus === 'ACCEPTED') && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase block">
                Weighbridge Metrics (Quintals)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Gross (Qtl)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Tare (Qtl)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-700 font-bold block mb-0.5">Net Crop (Qtl)</label>
                  <div className="w-full text-xs p-2 bg-emerald-100/70 border border-emerald-300 text-emerald-900 rounded-lg font-mono font-extrabold text-center">
                    {netWeight}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(targetStatus === 'QUALITY_CHECK' || targetStatus === 'ACCEPTED') && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase block">
                Quality Inspection Parameters
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Moisture (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisture}
                    onChange={(e) => setMoisture(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Foreign Matter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foreignMatter}
                    onChange={(e) => setForeignMatter(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Grade A">Grade A</option>
                    <option value="FAQ">FAQ (Standard)</option>
                    <option value="Grade B">Grade B</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {targetStatus === 'REJECTED' && (
            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase mb-1">
                Rejection Reason (Transmitted to Farmer)
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Officer Audit Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weighbridge calibration checked, sample tested on meter #4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-2 ${
                targetStatus === 'REJECTED'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm & Advance Stage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
