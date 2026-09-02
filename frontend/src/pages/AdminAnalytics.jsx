import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Wheat, 
  IndianRupee, 
  Building2, 
  RefreshCw,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';
import api from '../api/client';
import BottleneckAlert from '../components/BottleneckAlert';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
const STATUS_PIE_COLORS = {
  Completed: '#10b981',
  'In Processing': '#8b5cf6',
  Waiting: '#f59e0b',
  Rejected: '#f43f5e'
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState(1);

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    if (selectedCentreId) {
      fetchAnalytics(selectedCentreId);
    }
  }, [selectedCentreId]);

  const fetchCentres = async () => {
    try {
      const res = await api.get('/centres');
      setCentres(res.data);
      if (res.data.length > 0) {
        setSelectedCentreId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error loading centres:', err);
    }
  };

  const fetchAnalytics = async (cId) => {
    try {
      setRefreshing(true);
      const res = await api.get(`/analytics/dashboard?centre_id=${cId}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const statusPieData = analytics ? [
    { name: 'Completed', value: analytics.completed_count, color: '#10b981' },
    { name: 'In Processing', value: analytics.in_processing_count, color: '#8b5cf6' },
    { name: 'Waiting', value: analytics.waiting_count, color: '#f59e0b' },
    { name: 'Rejected', value: analytics.rejected_count, color: '#f43f5e' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">
              National Mandi Analytics & Decision Intelligence
            </span>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              SIH26032
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Procurement Operations & BI Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time throughput metrics, stage duration distributions, and AI bottleneck recommendations.
          </p>
        </div>

        {/* Mandi Centre Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            className="text-xs font-bold bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm focus:outline-none cursor-pointer"
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchAnalytics(selectedCentreId)}
            disabled={refreshing}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-300' : ''}`} />
          </button>
        </div>
      </div>

      {/* AI Bottleneck Detection Banner */}
      {analytics?.bottleneck && (
        <BottleneckAlert bottleneck={analytics.bottleneck} />
      )}

      {/* Top High-level Volume & Payout Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-bold uppercase block">Total Procured Volume</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {analytics?.total_procured_quintals || 0} <span className="text-sm font-semibold text-slate-500">Qtl</span>
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <Wheat className="w-3 h-3" /> Standard FAQ certified
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-bold uppercase block">Total MSP Payouts</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1 block">
            ₹{((analytics?.total_disbursed_inr || 0) / 100000).toFixed(2)} <span className="text-sm font-semibold text-slate-500">Lakh</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Direct Benefit Transfer (PFMS)
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-bold uppercase block">Avg Waiting Time</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {analytics?.avg_waiting_time_minutes || 24.5} <span className="text-sm font-semibold text-slate-500">mins</span>
          </span>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            Target benchmark: &lt; 30 mins
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-bold uppercase block">Avg Processing Duration</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {analytics?.avg_processing_time_minutes || 18.0} <span className="text-sm font-semibold text-slate-500">mins</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Weighbridge + Quality Lab
          </span>
        </div>
      </div>

      {/* Row 1: Hourly Arrivals & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Arrivals Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                Farmer Arrivals by Hour (Mandi Traffic)
              </h3>
              <p className="text-xs text-slate-500">Hourly vehicle influx vs average waiting queue time</p>
            </div>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.hourly_arrivals || []}>
                <defs>
                  <linearGradient id="colorFarmers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="farmers" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFarmers)" name="Farmer Arrivals" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Procurement Lifecycle Breakdown
            </h3>
            <p className="text-xs text-slate-500">Status proportion for today</p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {statusPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600">{d.name}:</span>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Crop Volume & Stage Durations vs Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Volume & MSP Disbursement Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Wheat className="w-4 h-4 text-emerald-700" />
              Procurement Volume by Crop Type (Quintals)
            </h3>
            <p className="text-xs text-slate-500">Distribution across Paddy, Wheat, Mustard, Cotton & Soybean</p>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.crop_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="quantity_quintals" fill="#10b981" radius={[6, 6, 0, 0]} name="Quantity (Qtl)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Duration by Stage vs Target Benchmark */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              Stage Duration vs Benchmark Standard (Minutes)
            </h3>
            <p className="text-xs text-slate-500">Identifies which stage causes maximum operational latency</p>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.stage_durations || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avg_duration_mins" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Actual Avg Duration (mins)" />
                <Bar dataKey="target_mins" fill="#64748b" radius={[6, 6, 0, 0]} name="Target Benchmark (mins)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
