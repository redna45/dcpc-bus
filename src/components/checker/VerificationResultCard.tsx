import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Calendar,
  RotateCcw,
  ShieldCheck,
  User,
  Clock,
} from 'lucide-react';
import { VerificationResultData } from '../../types';
import { formatDate, getRemainingDays } from '../../lib/dateUtils';

interface VerificationResultCardProps {
  data: VerificationResultData;
  onReset: () => void;
}

export const VerificationResultCard: React.FC<VerificationResultCardProps> = ({
  data,
  onReset,
}) => {
  const { result, passenger, subscription, message } = data;

  const daysLeft = subscription?.expiryDate ? getRemainingDays(subscription.expiryDate) : 0;

  // Render Status Badge/Banner
  const renderStatusBanner = () => {
    switch (result) {
      case 'valid':
        return (
          <div className="bg-emerald-500 text-white px-6 py-4 text-center rounded-2xl shadow-lg border-2 border-emerald-400 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-8 h-8 animate-bounce" />
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
                ACTIVE / VALID
              </h2>
            </div>
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mt-1">
              BOARDING PERMITTED • PASS VALID
            </p>
          </div>
        );

      case 'expired':
        return (
          <div className="bg-rose-600 text-white px-6 py-4 text-center rounded-2xl shadow-lg border-2 border-rose-500 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-8 h-8" />
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
                EXPIRED / NOT VALID
              </h2>
            </div>
            <p className="text-xs font-bold text-rose-100 uppercase tracking-widest mt-1">
              DO NOT BOARD • PASS EXPIRED
            </p>
          </div>
        );

      case 'no_active_subscription':
        return (
          <div className="bg-amber-500 text-slate-950 px-6 py-4 text-center rounded-2xl shadow-lg border-2 border-amber-400 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-slate-950" />
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
                NO ACTIVE SUBSCRIPTION
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mt-1">
              RIDER HAS NO ACTIVE PASS
            </p>
          </div>
        );

      case 'passenger_not_found':
      default:
        return (
          <div className="bg-slate-800 text-white px-6 py-4 text-center rounded-2xl shadow-lg border-2 border-slate-700 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-rose-400" />
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
                PASSENGER NOT FOUND
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">
              UNREGISTERED PASSENGER NUMBER
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-in fade-in">
      {/* 1. Large Unmistakable Status Banner */}
      {renderStatusBanner()}

      {/* 2. Passenger Identification Card */}
      {passenger ? (
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-300 shadow-xl space-y-5 text-center">
          {/* Prominent Passenger Photo for Visual Check */}
          <div className="relative inline-block mx-auto">
            <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-lg bg-slate-100">
              <img
                src={passenger.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${passenger.fullName}`}
                alt={passenger.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 p-2 bg-slate-900 text-amber-400 rounded-xl shadow-md border-2 border-white">
              <User className="w-5 h-5" />
            </span>
          </div>

          {/* Passenger Name & Number */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Passenger Name
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {passenger.fullName}
            </h3>
            <div className="font-mono text-base font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 inline-block mt-1">
              {passenger.passengerNumber || 'BUS-000000'}
            </div>
          </div>

          {/* Subscription Details Box */}
          {subscription ? (
            <div
              className={`p-4 rounded-2xl border text-left space-y-2.5 ${
                result === 'valid'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-rose-50/60 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Plan</span>
                  <p className="text-sm font-black text-slate-900">{subscription.planNameSnapshot}</p>
                </div>
                {result === 'valid' && (
                  <span className="font-mono text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                    {daysLeft} Days Left
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50">
                <div>
                  <span className="text-slate-500 font-medium block">Start Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(subscription.startDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Expiry Date:</span>
                  <span
                    className={`font-bold ${
                      result === 'valid' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatDate(subscription.expiryDate)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              {message || 'No subscription enrolled on this passenger record.'}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">No matching record in database</p>
          <p className="text-xs text-slate-400">
            {message || 'Please check the scanned QR code or verify the entered passenger number.'}
          </p>
        </div>
      )}

      {/* 3. Scan Next Passenger Big Button */}
      <button
        id="scan-next-passenger-btn"
        onClick={onReset}
        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
      >
        <RotateCcw className="w-5 h-5" />
        Scan Next Passenger
      </button>
    </div>
  );
};
