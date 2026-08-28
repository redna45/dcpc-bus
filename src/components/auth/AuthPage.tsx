import React, { useState } from 'react';
import { Bus, ShieldCheck, Sparkles, QrCode, CreditCard, Scan, Users, MapPin } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Logo } from '../common/Logo';
import { BRANDING } from '../../constants/branding';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 px-4 font-sans">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center">
          <Logo size="lg" showText={false} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
            {BRANDING.name}
          </h1>
          <p className="text-xs text-emerald-300 font-bold tracking-wider uppercase mt-1 flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{BRANDING.location} • Commuter Portal</span>
          </p>
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-5 sm:px-8 shadow-2xl rounded-3xl border border-emerald-100 space-y-6">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              id="auth-tab-login"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-register"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register Rider
            </button>
          </div>

          {/* Forms */}
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-white/80 text-[10px]">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <QrCode className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <span className="font-semibold">QR Bus Boarding</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <CreditCard className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <span className="font-semibold">GCash Unli Passes</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <span className="font-semibold">Naga City Routes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
