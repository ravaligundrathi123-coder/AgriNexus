import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FarmerDashboard from './pages/FarmerDashboard';
import BookSlot from './pages/BookSlot';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import Login from './pages/Login';
import PublicTracker from './pages/PublicTracker';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
  if (user.role === 'officer') return <Navigate to="/officer" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/farmer" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/farmer" element={<FarmerDashboard />} />
          <Route path="/book-slot" element={<BookSlot />} />
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/admin" element={<AdminAnalytics />} />
          <Route path="/track/:tokenNumber?" element={<PublicTracker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
