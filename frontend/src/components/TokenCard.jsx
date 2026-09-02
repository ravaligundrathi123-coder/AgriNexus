import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Share2, ExternalLink, QrCode, MapPin, Truck, Calendar, IndianRupee, ShieldCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function TokenCard({ procurement, onPrint }) {
  if (!procurement) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `KisanQueue Token ${procurement.token_number}`,
        text: `My live procurement token ${procurement.token_number} for ${procurement.crop_type} at ${procurement.centre_name}`,
        url: `${window.location.origin}/track/${procurement.token_number}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/track/${procurement.token_number}`);
      alert('Tracking link copied to clipboard!');
    }
  };

  return (
    <div id="printable-token" className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header Band */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
                Govt. of India e-Mandi Pass
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">KisanQueue Digital Token</h3>
          </div>
        </div>
        <div className="text-right">
          <StatusBadge status={procurement.status} size="sm" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium block">TOKEN IDENTIFIER</span>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono tracking-wider">
              {procurement.token_number}
            </span>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Slot: {procurement.slot_date} ({procurement.slot_time})
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                Vehicle: {procurement.vehicle_number || 'N/A'}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <QRCodeSVG 
              value={`${window.location.origin}/track/${procurement.token_number}`}
              size={90}
              level="M"
              fgColor="#0f3d21"
            />
            <span className="text-[9px] font-mono text-slate-400 mt-1">SCAN AT GATE</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-slate-100 text-sm">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Farmer Name</span>
            <span className="font-bold text-slate-800">{procurement.farmer_name || 'Ramesh Kumar'}</span>
            <span className="text-[11px] text-slate-500 block font-mono">{procurement.farmer_id_card || 'PB-KISAN-2024'}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Procurement Centre</span>
            <span className="font-bold text-slate-800 line-clamp-1">{procurement.centre_name}</span>
            <span className="text-[11px] text-slate-500 block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> APMC Mandi
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Crop & Quantity</span>
            <span className="font-bold text-slate-800">{procurement.crop_type} ({procurement.variety})</span>
            <span className="text-[11px] text-emerald-700 font-semibold block">
              {procurement.actual_quantity || procurement.estimated_quantity} Quintals
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Est. MSP Payout</span>
            <span className="font-bold text-emerald-700 text-base flex items-center">
              ₹{procurement.total_amount ? Number(procurement.total_amount).toLocaleString('en-IN') : '0'}
            </span>
            <span className="text-[11px] text-slate-400 block">@ ₹{procurement.msp_rate || 2300}/Qtl</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Pass
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Token
            </button>
          </div>

          <a
            href={`/track/${procurement.token_number}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Public Status Page <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
