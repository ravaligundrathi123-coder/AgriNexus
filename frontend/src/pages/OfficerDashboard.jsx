import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  Clock, 
  CheckCheck, 
  Scale, 
  FlaskConical, 
  RefreshCw, 
  SlidersHorizontal, 
  Plus, 
  Minus,
  Sparkles,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import StageUpdateModal from '../components/StageUpdateModal';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProcurement, setSelectedProcurement] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 6000); // 6-sec auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/officers/dashboard-summary');
      setData(res.data);
    } catch (err) {
      console.error('Error loading officer dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateCentreCounters = async (field, delta) => {
    if (!data?.centre) return;
    const currentVal = data.centre[field] || 1;
    const newVal = Math.max(1, currentVal + delta);

    try {
      await api.patch(`/centres/${data.centre.id}`, {
        [field]: newVal,
      });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update counter capacity:', err);
    }
  };

  const stats = data?.stats || {};
  const centre = data?.centre || {};
  const queue = data?.active_queue || [];

  const filteredQueue = queue.filter((p) => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesSearch = 
      p.token_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.crop_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Mandi Control Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              Procurement Command Center
            </span>
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10">
              Station Code: {centre.code || 'PB-SAM-01'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {centre.name || 'Punjab APMC Grain Mandi, Samrala'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active Duty Officer: <strong>{user?.full_name || 'Priya Sharma'}</strong> (Chief Weighbridge & Inspector)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={refreshing}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm border border-white/10 text-white"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-300' : ''}`} />
          </button>

          <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Queue Sync Active
          </span>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-bold uppercase block">Total Arrivals</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {stats.total_farmers_today || 0}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Farmers logged</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-card bg-amber-50/30">
          <span className="text-xs text-amber-800 font-bold uppercase block">Waiting Queue</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
            {stats.waiting_farmers || 0}
          </span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Vehicles in line</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-card bg-purple-50/30">
          <span className="text-xs text-purple-800 font-bold uppercase block">Processing</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1 block">
            {stats.currently_processing || 0}
          </span>
          <span className="text-[11px] text-purple-700 mt-0.5 block">On weigh/quality bench</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-card bg-emerald-50/30">
          <span className="text-xs text-emerald-800 font-bold uppercase block">Completed</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1 block">
            {stats.completed_procurements || 0}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Procured & DBT sent</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-bold uppercase block">Avg Wait Time</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {stats.average_waiting_time_minutes || 24.5}m
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Gate to bench</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-bold uppercase block">Avg Processing</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {stats.average_processing_time_minutes || 18.0}m
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Weigh + Lab check</span>
        </div>
      </div>

      {/* Centre Capacity Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
              Mandi Operational Capacity & Counter Controls
            </h3>
            <p className="text-xs text-slate-500">Adjust active counters dynamically to alleviate wait times and bottlenecks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* Weighbridge Counters */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Weighbridge Counters</span>
              <span className="text-[11px] text-slate-500">Gross/Tare scale gates</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateCentreCounters('active_weighing_counters', -1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-extrabold text-base text-slate-900 font-mono">
                {centre.active_weighing_counters || 2}
              </span>
              <button
                onClick={() => updateCentreCounters('active_weighing_counters', 1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quality Testing Counters */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Quality Testing Labs</span>
              <span className="text-[11px] text-slate-500">Moisture & purity meters</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateCentreCounters('active_quality_counters', -1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-extrabold text-base text-slate-900 font-mono">
                {centre.active_quality_counters || 2}
              </span>
              <button
                onClick={() => updateCentreCounters('active_quality_counters', 1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Staff Count */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">On-Duty Mandi Staff</span>
              <span className="text-[11px] text-slate-500">Graders, weighers, clerks</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateCentreCounters('active_staff_count', -1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-extrabold text-base text-slate-900 font-mono">
                {centre.active_staff_count || 8}
              </span>
              <button
                onClick={() => updateCentreCounters('active_staff_count', 1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Live Queue Management Terminal */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Live Mandi Queue & Stage Management
            </h3>
            <p className="text-xs text-slate-500">
              Advance farmers through Weighing → Quality Inspection → Acceptance → DBT Payout
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search token / farmer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="WAITING">Waiting Queue</option>
              <option value="WEIGHING">In Weighing</option>
              <option value="QUALITY_CHECK">Quality Check</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3.5 px-4">Q#</th>
                <th className="py-3.5 px-4">Token & Pass</th>
                <th className="py-3.5 px-4">Farmer Details</th>
                <th className="py-3.5 px-4">Crop & Qty</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Wait Time</th>
                <th className="py-3.5 px-4 text-right">Officer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active procurements matching the selected filter
                  </td>
                </tr>
              ) : (
                filteredQueue.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="w-6 h-6 rounded-full bg-slate-100 font-mono font-extrabold text-slate-700 flex items-center justify-center text-[11px]">
                        {p.queue_number || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div>
                        <span>{p.token_number}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {p.vehicle_number || 'No Vehicle'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{p.farmer_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.farmer_id_card}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{p.crop_type}</span>
                      <span className="text-slate-500 block text-[11px]">
                        {p.actual_quantity || p.estimated_quantity} Qtl ({p.variety})
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {p.estimated_waiting_formatted || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedProcurement(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        <span>Advance Stage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Update Modal */}
      {selectedProcurement && (
        <StageUpdateModal
          procurement={selectedProcurement}
          onClose={() => setSelectedProcurement(null)}
          onSuccess={fetchDashboard}
        />
      )}
    </div>
  );
}
