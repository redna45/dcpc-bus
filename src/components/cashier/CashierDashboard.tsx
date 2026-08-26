import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ShoppingBag,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Banknote,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PaymentRecord, Subscription, UserProfile } from '../../types';
import {
  getPendingPayments,
  getAllPayments,
  getAllSubscriptions,
  getPassengers,
} from '../../services/db';
import { PendingPaymentsQueue } from './PendingPaymentsQueue';
import { SellSubscriptionModal } from './SellSubscriptionModal';

interface CashierDashboardProps {
  onNavigate: (view: string) => void;
}

export const CashierDashboard: React.FC<CashierDashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [passengersCount, setPassengersCount] = useState(0);
  const [showSellModal, setShowSellModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [pending, allP, allS, passengers] = await Promise.all([
        getPendingPayments(),
        getAllPayments(),
        getAllSubscriptions(),
        getPassengers(),
      ]);
      setPendingPayments(pending);
      setAllPayments(allP);
      setSubscriptions(allS);
      setPassengersCount(passengers.length);
    } catch (err) {
      console.error('Error loading cashier metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (!userProfile) return null;

  // Calculate today's sales
  const today = new Date().toDateString();
  const todayPayments = allPayments.filter(
    (p) => p.status === 'approved' && new Date(p.submittedAt).toDateString() === today
  );
  const todaySalesTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
            Cashier & Payment Operations
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            Welcome, {userProfile.fullName}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Review pending GCash submissions and process over-the-counter subscription sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="cashier-sell-sub-btn"
            onClick={() => setShowSellModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            Sell Subscription
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase">Pending GCash Proofs</span>
            <h3 className="text-2xl font-black text-slate-900">{pendingPayments.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase">Today's Sales Revenue</span>
            <h3 className="text-2xl font-black text-emerald-700 font-mono">
              ₱{todaySalesTotal.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase">Active Subscriptions</span>
            <h3 className="text-2xl font-black text-slate-900">
              {subscriptions.filter((s) => s.status === 'active').length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase">Registered Riders</span>
            <h3 className="text-2xl font-black text-slate-900">{passengersCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Pending Payments Work Queue */}
      <PendingPaymentsQueue />

      {/* Manual Sell Subscription Modal */}
      {showSellModal && (
        <SellSubscriptionModal
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSuccess={() => {
            loadMetrics();
          }}
        />
      )}
    </div>
  );
};
