import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  QrCode,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Bus,
  CheckCircle2,
  Navigation,
  FileText,
  ChevronRight,
  Info,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Subscription, SubscriptionPlan, PaymentRecord } from '../../types';
import {
  getPassengerActiveSubscription,
  getSubscriptionPlans,
  getPassengerPayments,
  getPassengerSubscriptions,
} from '../../services/db';
import { formatDate, getRemainingDays, isSubscriptionActive } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';
import { MakePaymentModal } from './MakePaymentModal';
import { BRANDING } from '../../constants/branding';

interface PassengerDashboardProps {
  onNavigate: (view: string) => void;
}

export const PassengerDashboard: React.FC<PassengerDashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [sub, allPlans, payments, allSubs] = await Promise.all([
          getPassengerActiveSubscription(userProfile.uid),
          getSubscriptionPlans(true),
          getPassengerPayments(userProfile.uid),
          getPassengerSubscriptions(userProfile.uid),
        ]);
        setActiveSub(sub);
        setPlans(allPlans);
        setRecentPayments(payments.slice(0, 3));
        setHistoryCount(allSubs.length);
      } catch (err) {
        console.error('Error loading passenger dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile]);

  if (!userProfile) return null;

  const passengerNumber = userProfile.passengerNumber || 'PAS-000001';
  const hasActivePass = activeSub && isSubscriptionActive(activeSub);
  const daysLeft = activeSub?.expiryDate ? getRemainingDays(activeSub.expiryDate) : 0;

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-20 md:pb-6">
      
      {/* Grab-Inspired Header Card with Coop Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 text-white p-5 sm:p-7 shadow-xl shadow-emerald-950/10 border border-emerald-500/30">
        {/* Subtle Background Watermark */}
        <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10 pointer-events-none">
          <QRCodeSVG value={passengerNumber} size={220} />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Row: Location & Pass Status */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-100">
              <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{BRANDING.location}</span>
            </div>

            {hasActivePass ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-xs font-black tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-900 animate-pulse"></span>
                PASS ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/90 text-slate-950 text-xs font-black tracking-wide">
                NO ACTIVE PASS
              </span>
            )}
          </div>

          {/* Passenger Greeting & ID */}
          <div className="flex items-center gap-3.5 pt-1">
            <img
              src={userProfile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.fullName}`}
              alt={userProfile.fullName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md bg-white/20 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-emerald-200 uppercase tracking-wider">Welcome Commuter</p>
              <h2 className="text-lg sm:text-2xl font-black text-white truncate font-heading tracking-tight">
                {userProfile.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-extrabold bg-black/30 px-2 py-0.5 rounded-md border border-white/15 text-emerald-200">
                  {passengerNumber}
                </span>
                <span className="text-[11px] text-emerald-100/80 hidden sm:inline">• DCPC Co-op Rider</span>
              </div>
            </div>
          </div>

          {/* Grab-Style Pass Status Quick Bar */}
          <div className="mt-2 pt-3 border-t border-white/15 flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-emerald-200 block text-[10px] uppercase font-bold tracking-wider">Active Pass Status</span>
              {hasActivePass && activeSub ? (
                <span className="font-extrabold text-white text-sm">
                  {activeSub.planNameSnapshot} ({daysLeft} days left)
                </span>
              ) : (
                <span className="font-bold text-emerald-100 text-xs">
                  Choose a subscription to ride unli-buses
                </span>
              )}
            </div>

            <button
              id="dash-quick-show-qr-btn"
              onClick={() => onNavigate('my-qr')}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Show QR Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grab-Style 4-Pillar Quick Action Services Grid */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">
          DCPC Transit Services
        </h3>
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          
          {/* Action 1: Show Pass */}
          <button
            id="service-action-my-pass"
            onClick={() => onNavigate('my-qr')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-emerald-50/70 transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <QrCode className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-emerald-700 leading-tight">
              My Pass
            </span>
          </button>

          {/* Action 2: Buy Subscription */}
          <button
            id="service-action-plans"
            onClick={() => onNavigate('plans')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-emerald-50/70 transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
              <CreditCard className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-emerald-700 leading-tight">
              Buy Pass
            </span>
          </button>

          {/* Action 3: Payments & Top Up */}
          <button
            id="service-action-payments"
            onClick={() => onNavigate('payments')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-emerald-50/70 transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-blue-700 leading-tight">
              Payments
            </span>
          </button>

          {/* Action 4: Routes & Fares */}
          <button
            id="service-action-routes"
            onClick={() => setShowRoutesModal(true)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-emerald-50/70 transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Bus className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-amber-700 leading-tight">
              Sipocot Routes
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Pass Card & Live Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Active Subscription Status Box */}
        <div className="md:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-heading">
                  Active Commuter Subscription
                </h3>
                <p className="text-xs text-slate-500">Live pass validity & unli-ride pass status</p>
              </div>
            </div>
            {hasActivePass && <Badge status="active" size="md" />}
          </div>

          {hasActivePass && activeSub ? (
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                    Subscribed Plan
                  </span>
                  <h4 className="text-lg font-black text-slate-900 font-heading">{activeSub.planNameSnapshot}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Valid on all <span className="font-semibold text-emerald-700">DCPC Sipocot Coop Modern Buses</span>
                  </p>
                </div>

                <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-emerald-200">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Validity Period
                  </span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {daysLeft} <span className="text-xs font-bold text-emerald-700">Days Remaining</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Valid until {formatDate(activeSub.expiryDate)}
                  </p>
                </div>
              </div>

              {/* Start and Expiry pills */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold text-[11px]">Activation Date</span>
                  <span className="font-bold text-slate-800">{formatDate(activeSub.startDate)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold text-[11px]">Expiration Date</span>
                  <span className="font-bold text-slate-800">{formatDate(activeSub.expiryDate)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-7 space-y-3 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                <Bus className="w-6 h-6" />
              </div>
              <div className="px-4">
                <h4 className="text-sm font-extrabold text-slate-900 font-heading">No Active Commuter Pass</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Enjoy unlimited daily, weekly, or monthly rides across Sipocot, Naga, and Libmanan with DCPC Transport Coop passes.
                </p>
              </div>
              <button
                onClick={() => onNavigate('plans')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>Browse Subscription Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quick QR Passenger Boarding Pass Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-800 font-heading">Boarding Pass QR</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              SIPOCOT
            </span>
          </div>

          <div className="p-3 bg-emerald-50/50 border-2 border-emerald-600/30 rounded-2xl shadow-inner inline-block relative group">
            <QRCodeSVG value={passengerNumber} size={135} level="H" />
          </div>

          <div>
            <div className="font-mono text-sm font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 inline-block">
              {passengerNumber}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Present to DCPC Bus Checker for instant verification
            </p>
          </div>

          <button
            onClick={() => onNavigate('my-qr')}
            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>View Full QR & Print Pass</span>
          </button>
        </div>
      </div>

      {/* Featured Plans & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Popular Plans list */}
        <div className="md:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-heading">
                Popular DCPC Subscription Plans
              </h3>
              <p className="text-xs text-slate-500">Pick a plan and submit via GCash reference</p>
            </div>
            <button
              onClick={() => onNavigate('plans')}
              className="text-xs font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>All Plans ({plans.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className="border border-emerald-100 hover:border-emerald-500 rounded-2xl p-4 flex flex-col justify-between space-y-3 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {plan.durationDays} {plan.durationDays === 1 ? 'Day' : 'Days'}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-2 font-heading group-hover:text-emerald-600 transition-colors">
                    {plan.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 font-mono">₱{plan.price.toLocaleString()}</span>
                  <button
                    id={`quick-subscribe-plan-${plan.id}`}
                    onClick={() => setSelectedPlanForPayment(plan)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payment Submissions */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-heading">Recent Payments</h3>
              <p className="text-xs text-slate-500">GCash approval status</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-extrabold text-emerald-600 hover:text-emerald-800 cursor-pointer"
            >
              History
            </button>
          </div>

          {recentPayments.length > 0 ? (
            <div className="space-y-2.5">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-extrabold text-slate-800 truncate font-heading">{p.planName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ₱{p.amount.toLocaleString()} • {formatDate(p.submittedAt)}
                    </p>
                  </div>
                  <Badge status={p.status} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
              No GCash payment records yet
            </div>
          )}
        </div>
      </div>

      {/* Routes & Coop Details Modal */}
      {showRoutesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 font-heading">DCPC Sipocot Routes</h4>
                  <p className="text-xs text-slate-500">Official Transport Coop Network</p>
                </div>
              </div>
              <button
                onClick={() => setShowRoutesModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {BRANDING.routes.map((route, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 font-heading">{route.from}</span>
                    <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {route.fare}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>To: {route.to}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium pt-0.5">Est. Travel: {route.travelTime}</p>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-800">Operating Hours: {BRANDING.operatingHours}</p>
              <p>Terminal: Sipocot Central Bus Station, Camarines Sur</p>
            </div>

            <button
              onClick={() => setShowRoutesModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlanForPayment && (
        <MakePaymentModal
          isOpen={Boolean(selectedPlanForPayment)}
          onClose={() => setSelectedPlanForPayment(null)}
          plan={selectedPlanForPayment}
          onSuccess={() => {
            setSelectedPlanForPayment(null);
            onNavigate('payments');
          }}
        />
      )}
    </div>
  );
};
