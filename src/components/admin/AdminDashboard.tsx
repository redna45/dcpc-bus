import React, { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  ShieldCheck,
  Clock,
  TrendingUp,
  ShoppingBag,
  Layers,
  Scan,
  Settings as SettingsIcon,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, SubscriptionPlan, Subscription, PaymentRecord } from '../../types';
import {
  getPassengers,
  getSubscriptionPlans,
  getAllSubscriptions,
  getAllPayments,
  getPendingPayments,
} from '../../services/db';
import { isSubscriptionActive, formatCurrency } from '../../lib/dateUtils';
import { SellSubscriptionModal } from '../cashier/SellSubscriptionModal';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [passengers, setPassengers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [passList, planList, subList, payList, pendList] = await Promise.all([
        getPassengers(),
        getSubscriptionPlans(),
        getAllSubscriptions(),
        getAllPayments(),
        getPendingPayments(),
      ]);
      setPassengers(passList);
      setPlans(planList);
      setSubscriptions(subList);
      setPayments(payList);
      setPendingPayments(pendList);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!userProfile) return null;

  const activeSubs = subscriptions.filter(isSubscriptionActive);
  const expiredSubs = subscriptions.filter((s) => !isSubscriptionActive(s) && s.status !== 'pending');

  const today = new Date().toDateString();
  const todayApproved = payments.filter(
    (p) => p.status === 'approved' && new Date(p.submittedAt).toDateString() === today
  );
  const todayRevenue = todayApproved.reduce((sum, p) => sum + p.amount, 0);
  const totalRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Admin Hero Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" /> Executive Administration Portal
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {userProfile ? 'DCPC BAPAGTRANSCO Control' : 'Transit Administration'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Live overview of Bagong Pag-Asa Transport Cooperative commuter passes, cashier GCash pipelines, revenue, and checker scans.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="admin-quick-sell-btn"
            onClick={() => setShowSellModal(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Sell Subscription
          </button>
          <button
            onClick={() => onNavigate('plans')}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition"
          >
            <CreditCard className="w-4 h-4" />
            Manage Plans
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Passengers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{passengers.length}</div>
          <span className="text-[10px] text-slate-500 font-medium">Registered Riders</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-emerald-600 font-bold uppercase block">Active Passes</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeSubs.length}</div>
          <span className="text-[10px] text-slate-500 font-medium">Valid for ride</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-rose-600 font-bold uppercase block">Expired</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{expiredSubs.length}</div>
          <span className="text-[10px] text-slate-500 font-medium">Past validity</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-amber-600 font-bold uppercase block">Pending GCash</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingPayments.length}</div>
          <span className="text-[10px] text-slate-500 font-medium">Review queue</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-indigo-600 font-bold uppercase block">Today Sales</span>
          <div className="text-xl font-black text-indigo-700 font-mono mt-1">
            ₱{todayRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{todayApproved.length} Passes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-purple-600 font-bold uppercase block">Total Sales</span>
          <div className="text-xl font-black text-purple-700 font-mono mt-1">
            ₱{totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">All approved</span>
        </div>
      </div>

      {/* Quick Navigation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md cursor-pointer transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                GCash Payment Approvals
              </h4>
              <p className="text-xs text-slate-500">{pendingPayments.length} pending review</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => onNavigate('passengers')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md cursor-pointer transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                Passenger Database
              </h4>
              <p className="text-xs text-slate-500">{passengers.length} riders registered</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => onNavigate('staff')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md cursor-pointer transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                Staff & Roles Management
              </h4>
              <p className="text-xs text-slate-500">Cashiers, Checkers & Admins</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Manual Sell Modal */}
      {showSellModal && (
        <SellSubscriptionModal
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
};
