import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wheat, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  CreditCard, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, switchPersona } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [email, setEmail] = useState('ramesh.kumar@kisannexus.gov.in');
  const [password, setPassword] = useState('farmer123');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Punjab');
  const [district, setDistrict] = useState('Ludhiana');
  const [village, setVillage] = useState('Samrala');
  const [landAcres, setLandAcres] = useState('4.0');
  const [bankAccount, setBankAccount] = useState('30981728912');
  const [ifsc, setIfsc] = useState('SBIN0001420');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const user = await register({
          email,
          password,
          full_name: fullName,
          phone,
          role: 'farmer',
          state,
          district,
          village,
          land_area_acres: parseFloat(landAcres) || 3.0,
          bank_account_no: bankAccount,
          ifsc_code: ifsc,
        });
        navigate('/farmer');
      } else {
        const user = await login(email, password);
        if (user.role === 'farmer') navigate('/farmer');
        else if (user.role === 'officer') navigate('/officer');
        else if (user.role === 'admin') navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (demoEmail, demoPass, targetRoute) => {
    setError('');
    setLoading(true);
    try {
      await switchPersona(demoEmail, demoPass);
      navigate(targetRoute);
    } catch (err) {
      setError('Failed to switch demo persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand & Quick Demo Persona Selectors */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              SIH 2026 Problem Statement SIH26032
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Kisan<span className="text-emerald-700">Queue</span>
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Intelligent Farmer Procurement Queue & Waiting-Time Tracking Platform for Indian Agricultural Mandis.
            </p>
          </div>

          {/* 1-Click Demo Evaluation Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              1-Click Demo Persona Access (Evaluator Mode)
            </span>

            {/* Farmer Demo */}
            <button
              onClick={() => handleQuickPersona('ramesh.kumar@kisannexus.gov.in', 'farmer123', '/farmer')}
              className="w-full text-left p-3.5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
                  🌾
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">Ramesh Kumar</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">Farmer</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Live Paddy Token in Queue #1 | Samrala Mandi</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition" />
            </button>

            {/* Officer Demo */}
            <button
              onClick={() => handleQuickPersona('officer.priya@kisannexus.gov.in', 'officer123', '/officer')}
              className="w-full text-left p-3.5 rounded-2xl bg-white border border-blue-200 hover:border-blue-500 hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">Priya Sharma</span>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">Procurement Officer</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Weighbridge & Quality Inspector Console</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition" />
            </button>

            {/* Admin Demo */}
            <button
              onClick={() => handleQuickPersona('admin@kisannexus.gov.in', 'admin123', '/admin')}
              className="w-full text-left p-3.5 rounded-2xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
                  📊
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">Rajesh Verma</span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded">Mandi Administrator</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Bottleneck AI, Capacity & BI Analytics</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              {isRegister ? 'Farmer Registration' : 'Account Sign In'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              {isRegister ? 'Already registered? Login' : 'New Farmer? Register'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Farmer Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sardar Gurmukh Singh"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98150..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Land Area (Acres)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={landAcres}
                      onChange={(e) => setLandAcres(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Village</label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Bank Account No. (DBT)
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isRegister ? 'Register & Generate Farmer ID' : 'Sign In to Portal'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
