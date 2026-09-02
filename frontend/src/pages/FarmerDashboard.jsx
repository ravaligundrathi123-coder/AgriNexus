import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wheat, 
  CalendarPlus, 
  Clock, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Building2, 
  User, 
  FileText 
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import TimelineTracker from '../components/TimelineTracker';
import WaitingIndicator from '../components/WaitingIndicator';
import TokenCard from '../components/TokenCard';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [activeProcurement, setActiveProcurement] = useState(null);
  const [allProcurements, setAllProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8-sec live refresh
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [tokenRes, listRes] = await Promise.allSettled([
        api.get('/farmers/me/active-token'),
        api.get('/farmers/me/procurements'),
      ]);

      if (tokenRes.status === 'fulfilled') {
        setActiveProcurement(tokenRes.value.data);
      } else {
        setActiveProcurement(null);
      }

      if (listRes.status === 'fulfilled') {
        setAllProcurements(listRes.value.data);
        if (!activeProcurement && listRes.value.data.length > 0) {
          setActiveProcurement(listRes.value.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching farmer data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const farmerProfile = user?.farmer_profile;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Farmer Profile & Quick Action */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-inner">
              👨‍🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  Kisan Digital Portal
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  PM-KISAN Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                {user?.full_name || 'Farmer Portal'}
              </h1>
              <p className="text-xs text-emerald-200/80 mt-1 flex flex-wrap items-center gap-3">
                <span>Card ID: <strong>{farmerProfile?.farmer_id_card || 'PB-KISAN-2024-001'}</strong></span>
                <span>•</span>
                <span>Mandi: <strong>Samrala Grain Mandi</strong></span>
                <span>•</span>
                <span>Land: <strong>{farmerProfile?.land_area_acres || '4.5'} Acres</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition backdrop-blur-sm border border-white/10"
              title="Refresh Live Status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-300' : ''}`} />
            </button>

            <Link
              to="/book-slot"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Book Procurement Slot</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Active Procurement Section */}
      {activeProcurement ? (
        <div className="space-y-6">
          {/* Waiting Indicator & AI Prediction */}
          <WaitingIndicator
            estimatedMinutes={activeProcurement.estimated_waiting_minutes}
            farmersAhead={activeProcurement.farmers_ahead}
            confidenceScore={activeProcurement.prediction_confidence}
            factors={activeProcurement.prediction_factors}
            status={activeProcurement.status}
          />

          {/* 7-Stage Live Timeline Tracker */}
          <TimelineTracker
            status={activeProcurement.status}
            statusHistory={activeProcurement.status_history || []}
          />

          {/* Digital Token Pass Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TokenCard procurement={activeProcurement} />
            </div>

            {/* Quick Mandi Info & Guidelines */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  Mandi Centre Advisory
                </h4>
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 block">Weighbridge Gate #1</span>
                    <span>Keep vehicle registration & token printout/SMS ready at entry.</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 block">Moisture Standards</span>
                    <span>Paddy moisture must be below 17.0% for immediate Grade A certification.</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 font-medium">
                    <span className="font-bold block">DBT Direct Transfer</span>
                    <span>MSP payout is credited directly to your Aadhaar-linked bank account within 24-48 hrs.</span>
                  </div>
                </div>
              </div>

              {/* Payment Summary if completed or pending */}
              {activeProcurement.payment && (
                <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-card">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    DBT Payment Transfer Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Amount Approved:</span>
                      <span className="font-extrabold text-slate-900">₹{activeProcurement.payment.amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">MSP Rate:</span>
                      <span className="font-bold text-slate-800">₹{activeProcurement.payment.msp_rate} / Qtl</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Transaction Status:</span>
                      <span className="font-bold text-emerald-700 uppercase">{activeProcurement.payment.status}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">PFMS Ref:</span>
                      <span className="font-mono text-[11px] text-slate-600">{activeProcurement.payment.transaction_ref}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-2xl">
            🌾
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">No Active Procurement Token</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You do not have any crop procurement in queue. Click below to register your harvest and receive an instant digital token with live queue tracking.
          </p>
          <Link
            to="/book-slot"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            <CalendarPlus className="w-4 h-4" />
            Book Your Procurement Slot Now
          </Link>
        </div>
      )}

      {/* Procurement History Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Your Procurement History</h3>
            <p className="text-xs text-slate-500">All registered crop consignments and tokens</p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Token Number</th>
                <th className="py-3 px-4">Centre / Mandi</th>
                <th className="py-3 px-4">Crop & Qty</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">MSP Payout</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allProcurements.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {p.token_number}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {p.centre_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800">{p.crop_type}</span>
                    <span className="text-slate-500 block text-[11px]">{p.actual_quantity || p.estimated_quantity} Qtl</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {p.slot_date}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    ₹{p.total_amount ? Number(p.total_amount).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setActiveProcurement(p)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-[11px] rounded-lg transition"
                    >
                      View Live Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
