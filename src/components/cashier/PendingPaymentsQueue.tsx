import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentRecord, SubscriptionPlan } from '../../types';
import {
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getSubscriptionPlans,
} from '../../services/db';
import { formatDateTime, formatDate } from '../../lib/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

export const PendingPaymentsQueue: React.FC = () => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [rejectionModalPayment, setRejectionModalPayment] = useState<PaymentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, allPlans] = await Promise.all([
        getPendingPayments(),
        getSubscriptionPlans(),
      ]);
      setPayments(pending);
      setPlans(allPlans);
    } catch (err) {
      console.error('Error loading pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!userProfile) return null;

  const handleApprove = async (payment: PaymentRecord) => {
    if (processingId) return;
    setProcessingId(payment.id);
    setStatusMessage(null);

    try {
      // Find matching plan to get duration
      const plan = plans.find((p) => p.id === payment.planId);
      const durationDays = plan ? plan.durationDays : 30; // fallback 30 days

      await approvePayment(
        payment.id,
        userProfile.uid,
        userProfile.fullName,
        durationDays
      );

      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } catch {}

      setStatusMessage({
        type: 'success',
        text: `Payment approved! Subscription activated for ${payment.passengerName} (${payment.passengerNumber}).`,
      });

      setSelectedPayment(null);
      await loadData();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to approve payment.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalPayment || processingId) return;

    setProcessingId(rejectionModalPayment.id);
    try {
      await rejectPayment(
        rejectionModalPayment.id,
        userProfile.uid,
        userProfile.fullName,
        rejectionReason
      );

      setStatusMessage({
        type: 'success',
        text: `Payment rejected for ${rejectionModalPayment.passengerName}.`,
      });

      setRejectionModalPayment(null);
      setSelectedPayment(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reject payment.' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.passengerName.toLowerCase().includes(term) ||
      p.passengerNumber.toLowerCase().includes(term) ||
      p.planName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Pending GCash Payment Verifications
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {payments.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Inspect GCash payment receipts and activate passenger subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search passenger or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Pending Payments Table/Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Loading pending payment queue...
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Passenger</th>
                  <th className="px-6 py-3.5">Subscription Plan</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Submitted Time</th>
                  <th className="px-6 py-3.5">GCash Proof</th>
                  <th className="px-6 py-3.5 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{p.passengerName}</p>
                        <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {p.passengerNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{p.planName}</p>
                      <span className="text-[10px] text-slate-400">GCash Express Send</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-slate-900 text-sm">
                      ₱{p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDateTime(p.submittedAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Receipt
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          id={`approve-btn-${p.id}`}
                          onClick={() => handleApprove(p)}
                          disabled={processingId === p.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          id={`reject-btn-${p.id}`}
                          onClick={() => setRejectionModalPayment(p)}
                          disabled={processingId === p.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">All caught up!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no pending GCash payment submissions awaiting cashier review.
          </p>
        </div>
      )}

      {/* Review Modal */}
      {selectedPayment && (
        <Modal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title={`Review GCash Receipt - ${selectedPayment.passengerName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Passenger</span>
                <span className="font-bold text-slate-900">{selectedPayment.passengerName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Passenger ID</span>
                <span className="font-mono font-bold text-indigo-700">{selectedPayment.passengerNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Plan</span>
                <span className="font-bold text-slate-900">{selectedPayment.planName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Amount</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₱{selectedPayment.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Receipt Image Display */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[420px] p-2">
              <img
                src={selectedPayment.screenshotUrl}
                alt="GCash Proof of Payment"
                className="max-h-[400px] w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectionModalPayment(selectedPayment)}
                disabled={processingId === selectedPayment.id}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Submission
              </button>

              <button
                onClick={() => handleApprove(selectedPayment)}
                disabled={processingId === selectedPayment.id}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {processingId === selectedPayment.id ? 'Approving...' : 'Approve & Activate Pass'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalPayment && (
        <Modal
          isOpen={Boolean(rejectionModalPayment)}
          onClose={() => setRejectionModalPayment(null)}
          title="Reject Payment Submission"
        >
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-xs text-slate-600">
              Please enter a reason for rejecting this payment submission for{' '}
              <strong>{rejectionModalPayment.passengerName}</strong>. The passenger will see this note.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Unclear receipt screenshot, incorrect amount sent, reference number not found in GCash merchant account..."
                required
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalPayment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingId === rejectionModalPayment.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {processingId === rejectionModalPayment.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
