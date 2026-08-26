import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, CheckCircle, XCircle, Clock, RefreshCw, Search } from 'lucide-react';
import { PaymentRecord, SubscriptionPlan } from '../../types';
import { getAllPayments, getSubscriptionPlans, approvePayment, rejectPayment } from '../../services/db';
import { formatDateTime, formatDate } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export const ManagePayments: React.FC = () => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allP, allPlans] = await Promise.all([getAllPayments(), getSubscriptionPlans()]);
      setPayments(allP);
      setPlans(allPlans);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (payment: PaymentRecord) => {
    if (!userProfile) return;
    try {
      const plan = plans.find((p) => p.id === payment.planId);
      const durationDays = plan ? plan.durationDays : 30;
      await approvePayment(payment.id, userProfile.uid, userProfile.fullName, durationDays);
      await loadData();
    } catch (err: any) {
      alert('Error approving payment: ' + err.message);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !rejectingPayment) return;
    try {
      await rejectPayment(rejectingPayment.id, userProfile.uid, userProfile.fullName, rejectionReason);
      setRejectingPayment(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      alert('Error rejecting payment: ' + err.message);
    }
  };

  const filtered = payments.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.passengerName.toLowerCase().includes(term) ||
      p.passengerNumber.toLowerCase().includes(term) ||
      p.planName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Payments & Transaction Records</h2>
          <p className="text-xs text-slate-500">
            Monitor GCash payments, cashier direct cash sales, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search passenger or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Records ({payments.length})
        </button>
        <button
          onClick={() => setFilter('pending_review')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'pending_review'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Review ({payments.filter((p) => p.status === 'pending_review').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Approved ({payments.filter((p) => p.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rejected ({payments.filter((p) => p.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading payment records...
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Passenger</th>
                  <th className="px-6 py-3.5">Plan / Package</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{p.passengerName}</p>
                      <span className="font-mono text-[11px] font-bold text-indigo-700">
                        {p.passengerNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{p.planName}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      ₱{p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDateTime(p.submittedAt)}</td>
                    <td className="px-6 py-4">
                      <Badge status={p.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {p.screenshotUrl && (
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                            title="Inspect Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {p.status === 'pending_review' && (
                          <>
                            <button
                              onClick={() => handleApprove(p)}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingPayment(p)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 text-xs text-slate-400">
          No payments found for the selected filter.
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title={`Payment Receipt - ${selectedReceipt.passengerName}`}
        >
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block font-medium">Passenger</span>
                <span className="font-bold">{selectedReceipt.passengerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Amount</span>
                <span className="font-bold font-mono">₱{selectedReceipt.amount.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-2 flex items-center justify-center max-h-96">
              <img
                src={selectedReceipt.screenshotUrl}
                alt="Receipt"
                className="max-h-96 w-auto object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {rejectingPayment && (
        <Modal
          isOpen={Boolean(rejectingPayment)}
          onClose={() => setRejectingPayment(null)}
          title="Reject Payment"
        >
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-xs text-slate-600">
              Provide reason for rejecting payment for <strong>{rejectingPayment.passengerName}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Unclear screenshot or invalid reference code"
              required
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Reject Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
