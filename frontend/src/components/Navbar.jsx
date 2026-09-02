import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Wheat, 
  Users, 
  BarChart3, 
  CalendarPlus, 
  Layers, 
  LogOut, 
  Languages, 
  Shield, 
  ChevronDown, 
  Sparkles,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, logout, switchPersona, demoUsers, language, setLanguage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [personaOpen, setPersonaOpen] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');

  const handleQuickSwitch = async (email, password) => {
    setPersonaOpen(false);
    await switchPersona(email, password);
    if (email.includes('farmer')) navigate('/farmer');
    else if (email.includes('officer')) navigate('/officer');
    else if (email.includes('admin')) navigate('/admin');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (tokenSearch.trim()) {
      navigate(`/track/${tokenSearch.trim()}`);
      setTokenSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      {/* Top Govt Bar with Tiranga stripe */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 flex items-center justify-between border-b border-emerald-900">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-emerald-500" />
          <span className="font-semibold text-white">Department of Agriculture & Farmers Welfare</span>
          <span className="hidden sm:inline text-slate-400">| Govt. of India</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
            SIH 2026 Problem ID: SIH26032
          </span>
          {/* Language Selector */}
          <div className="flex items-center gap-1 text-[11px]">
            <Languages className="w-3 h-3 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
              <option value="pa" className="bg-slate-900 text-white">ਪੰਜਾਬੀ (Punjabi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition">
                <Wheat className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
                    Kisan<span className="text-emerald-700">Queue</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Mandi AI
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block -mt-1 font-medium">
                  Smart Procurement Queue & Status Tracker
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Token Search Form */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Token (e.g. KQ-PB-001)..."
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-full focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
            />
          </form>

          {/* Nav Links based on Role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              {user.role === 'farmer' && (
                <>
                  <Link
                    to="/farmer"
                    className={`px-3 py-2 rounded-xl transition ${
                      location.pathname === '/farmer'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    My Queue Pass
                  </Link>
                  <Link
                    to="/book-slot"
                    className={`px-3 py-2 rounded-xl flex items-center gap-1 transition ${
                      location.pathname === '/book-slot'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-emerald-600" />
                    Book Procurement Slot
                  </Link>
                </>
              )}

              {user.role === 'officer' && (
                <>
                  <Link
                    to="/officer"
                    className={`px-3 py-2 rounded-xl flex items-center gap-1 transition ${
                      location.pathname === '/officer'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Mandi Command Center
                  </Link>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-xl flex items-center gap-1 transition ${
                      location.pathname === '/admin'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    Bottleneck Analytics
                  </Link>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-xl flex items-center gap-1 transition ${
                      location.pathname === '/admin'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    Admin & Analytics
                  </Link>
                  <Link
                    to="/officer"
                    className={`px-3 py-2 rounded-xl flex items-center gap-1 transition ${
                      location.pathname === '/officer'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Officer Console
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Actions: Persona Switcher & Profile */}
          <div className="flex items-center gap-2">
            {/* Quick Persona Switcher Button (Demo Hackathon helper) */}
            <div className="relative">
              <button
                onClick={() => setPersonaOpen(!personaOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Demo Switcher</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {personaOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPersonaOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 p-2 animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold text-slate-400 uppercase px-3 py-1 block">
                      Switch Active Demo Persona
                    </span>
                    <div className="space-y-1 mt-1">
                      <button
                        onClick={() => handleQuickSwitch('ramesh.kumar@kisannexus.gov.in', 'farmer123')}
                        className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl transition flex items-center gap-2.5 text-xs"
                      >
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                          🌾
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">Ramesh Kumar (Farmer)</span>
                          <span className="text-[10px] text-slate-500">Waiting in Queue #1 | Samrala Mandi</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleQuickSwitch('officer.priya@kisannexus.gov.in', 'officer123')}
                        className="w-full text-left p-2.5 hover:bg-blue-50 rounded-xl transition flex items-center gap-2.5 text-xs"
                      >
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">
                          📋
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">Priya Sharma (Officer)</span>
                          <span className="text-[10px] text-slate-500">Weighbridge & Quality Inspector</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleQuickSwitch('admin@kisannexus.gov.in', 'admin123')}
                        className="w-full text-left p-2.5 hover:bg-purple-50 rounded-xl transition flex items-center gap-2.5 text-xs"
                      >
                        <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0">
                          📊
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">Rajesh Verma (Admin)</span>
                          <span className="text-[10px] text-slate-500">Mandi Analytics & Bottlenecks</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notification Dropdown */}
            {user && <NotificationDropdown />}

            {/* User details / Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right text-xs leading-tight">
                  <span className="font-bold text-slate-800 block truncate max-w-[120px]">{user.full_name}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
