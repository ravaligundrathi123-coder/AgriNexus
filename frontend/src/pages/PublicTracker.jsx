import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Wheat, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import TimelineTracker from '../components/TimelineTracker';
import WaitingIndicator from '../components/WaitingIndicator';
import TokenCard from '../components/TokenCard';

export default function PublicTracker() {
  const { tokenNumber } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(tokenNumber || '');
  const [procurement, setProcurement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tokenNumber) {
      fetchTokenDetails(tokenNumber);
    }
  }, [tokenNumber]);

  const fetchTokenDetails = async (tNum) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/procurements/token/${tNum}`);
      setProcurement(res.data);
    } catch (err) {
      setError('Token identifier not found. Please verify token number from your SMS or printed pass.');
      setProcurement(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/track/${query.trim()}`);
      fetchTokenDetails(query.trim());
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Search Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-700/20">
            🌾
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Live Mandi Token Tracker
            </h1>
            <p className="text-xs text-slate-500">
              Check real-time queue position, weighing status, and estimated waiting time.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Enter Token ID (e.g. KQ-PB-260902-001)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-xs font-mono font-bold pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>Track Live Status</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Display */}
      {procurement && (
        <div className="space-y-6">
          <WaitingIndicator
            estimatedMinutes={procurement.estimated_waiting_minutes}
            farmersAhead={procurement.farmers_ahead}
            confidenceScore={procurement.prediction_confidence}
            factors={procurement.prediction_factors}
            status={procurement.status}
          />

          <TimelineTracker
            status={procurement.status}
            statusHistory={procurement.status_history || []}
          />

          <TokenCard procurement={procurement} />
        </div>
      )}
    </div>
  );
}
