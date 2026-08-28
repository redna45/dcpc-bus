import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ShieldCheck, Printer, AlertTriangle, ArrowRight, CheckCircle, MapPin, Bus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Subscription, CompanySettings } from '../../types';
import { getPassengerActiveSubscription, getCompanySettings } from '../../services/db';
import { formatDate, getRemainingDays, isSubscriptionActive } from '../../lib/dateUtils';
import { PrintableIdCard } from '../common/PrintableIdCard';
import { BRANDING } from '../../constants/branding';
import { Logo } from '../common/Logo';

interface MyQrCardProps {
  onNavigate?: (view: string) => void;
}

export const MyQrCard: React.FC<MyQrCardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    Promise.all([
      getPassengerActiveSubscription(userProfile.uid),
      getCompanySettings(),
    ]).then(([sub, comp]) => {
      setActiveSub(sub);
      setCompanySettings(comp);
      setLoading(false);
    });
  }, [userProfile]);

  if (!userProfile) return null;

  const passengerNumber = userProfile.passengerNumber || 'PAS-000001';
  const hasActivePass = activeSub && isSubscriptionActive(activeSub);
  const daysLeft = activeSub?.expiryDate ? getRemainingDays(activeSub.expiryDate) : 0;
  const companyName = companySettings?.companyName || BRANDING.name;

  return (
    <div className="max-w-xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 font-heading tracking-tight">
            Digital Commuter Pass
          </h2>
          <p className="text-xs text-slate-500">Scan at bus entrance or inspection</p>
        </div>
        <button
          id="toggle-print-card-view-btn"
          onClick={() => setShowPrintModal(!showPrintModal)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{showPrintModal ? 'Mobile View' : 'Printable ID Badge'}</span>
        </button>
      </div>

      {showPrintModal ? (
        <PrintableIdCard
          passenger={userProfile}
          subscription={activeSub}
          companyName={companyName}
        />
      ) : (
        /* Grab-Style Digital Mobile Boarding Pass */
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
          
          {/* Cooperative Header Strip */}
          <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo size="xs" showText={false} />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider font-heading leading-tight">
                  {companyName}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-emerald-200 font-semibold">
                  <MapPin className="w-2.5 h-2.5 text-emerald-300" />
                  <span>{BRANDING.location}</span>
                </div>
              </div>
            </div>

            <span className="text-[10px] font-extrabold font-mono bg-emerald-900/60 border border-emerald-400/40 px-2 py-0.5 rounded-md text-emerald-200 uppercase">
              Rider Pass
            </span>
          </div>

          {/* Pass Status Banner */}
          <div
            className={`px-5 py-3 flex items-center justify-between text-white ${
              hasActivePass
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                : 'bg-gradient-to-r from-slate-800 to-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-white" />
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-heading">
                  {hasActivePass ? 'VALID PASS • BOARDING READY' : 'NO ACTIVE PASS'}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-white/90">
                  {hasActivePass
                    ? `Valid until ${formatDate(activeSub?.expiryDate)}`
                    : 'Subscribe to ride without paying per trip'}
                </p>
              </div>
            </div>

            {hasActivePass && (
              <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-mono font-black px-2.5 py-1 rounded-xl">
                {daysLeft} Days Left
              </span>
            )}
          </div>

          {/* Passenger Identity & High-Contrast Boarding QR */}
          <div className="p-5 sm:p-7 flex flex-col items-center text-center space-y-5">
            <div className="relative">
              <img
                src={userProfile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.fullName}`}
                alt={userProfile.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-emerald-100 shadow-md bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-xl border-2 border-white shadow-xs">
                <QrCode className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 font-heading">{userProfile.fullName}</h3>
              <p className="text-xs text-slate-500 font-medium">{userProfile.mobileNumber || userProfile.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">Pass ID:</span>
                <span className="font-mono text-xs font-black text-emerald-900">{passengerNumber}</span>
              </div>
            </div>

            {/* High-Contrast Large QR Box */}
            <div className="p-4 bg-white border-4 border-emerald-600 rounded-3xl shadow-lg inline-block">
              <QRCodeSVG
                value={passengerNumber}
                size={200}
                level="H"
                includeMargin={true}
                className="w-full max-w-[200px] h-auto"
              />
              <div className="text-center mt-1.5">
                <span className="text-[10px] font-mono font-black text-emerald-800 tracking-widest uppercase">
                  DCPC OFFICIAL PASS QR
                </span>
              </div>
            </div>

            {/* Active Subscription Details */}
            {hasActivePass && activeSub ? (
              <div className="w-full bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Active Plan:</span>
                  <span className="font-extrabold text-slate-900 font-heading">{activeSub.planNameSnapshot}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Activated On:</span>
                  <span className="font-bold text-slate-900">{formatDate(activeSub.startDate)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Expires:</span>
                  <span className="font-black text-emerald-700">{formatDate(activeSub.expiryDate)}</span>
                </div>
              </div>
            ) : (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-900 font-heading">No active ride subscription</h4>
                    <p className="text-[11px] text-amber-800">Get a pass to enable automatic bus checker validation.</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate && onNavigate('plans')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shrink-0 transition shadow-xs cursor-pointer active:scale-95"
                >
                  Buy Pass
                </button>
              </div>
            )}

            {/* Checker instructions */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 w-full">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Present this QR to DCPC Conductor / Checker upon boarding.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
