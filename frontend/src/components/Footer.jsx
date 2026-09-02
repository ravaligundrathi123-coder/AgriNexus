import React from 'react';
import { Wheat, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs mt-16 border-t border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Wheat className="w-4 h-4 text-amber-300" />
              </div>
              <span>KisanQueue — Smart Mandi Queue Platform</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Developed for <strong>Smart India Hackathon (SIH 2026)</strong> under Problem Statement <strong>SIH26032</strong> (Farmer Procurement Waiting/Status). Designed to eliminate physical congestion, provide transparent queue tracking, and accelerate DBT payments for farmers across India.
            </p>
          </div>

          {/* Col 2: Mandi Integration */}
          <div>
            <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-3">
              Mandi Features
            </span>
            <ul className="space-y-2 text-[12px]">
              <li>• Real-Time FIFO Queue Tracking</li>
              <li>• AI Waiting-Time Regressor</li>
              <li>• 7-Stage Procurement Lifecycle</li>
              <li>• Automated MSP & DBT Calculations</li>
              <li>• Bottleneck & Capacity Diagnostics</li>
            </ul>
          </div>

          {/* Col 3: Compliance & Govt */}
          <div>
            <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-3">
              Govt. Standards
            </span>
            <ul className="space-y-2 text-[12px]">
              <li className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> PM-KISAN Compatible
              </li>
              <li>• e-NAM & APMC Protocol Ready</li>
              <li>• PFMS Direct Benefit Transfer</li>
              <li>• FAQ Quality Grading Norms</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div>
            © 2026 KisanQueue | National Agriculture Intelligence Initiative
          </div>
          <div className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Indian Farmers & Mandi Officers
          </div>
        </div>
      </div>
    </footer>
  );
}
