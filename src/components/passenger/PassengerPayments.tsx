import React, { useEffect, useState } from 'react';
import { Clock, Eye, AlertCircle, RefreshCw, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PaymentRecord } from '../../types';
import { getPassengerPayments } from '../../services/db';
import { formatDate, formatDateTime } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const PassengerPayments: React.FC = () => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const loadPayments = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const list = await getPassengerPayments(userProfile.uid);
      setPayments(list);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [userProfile]);

  if (!userProfile) return null;

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 font-heading tracking-tight">
            My GCash Payment Submissions
          </h2>
          <p className="text-xs text-slate-500">Track cashier validation and pass approvals</p>
        </div>
        <button
          onClick={loadPayments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-3xl border border-emerald-100 shadow-sm">
          Loading GCash payment records...
        </div>
      ) : payments.length > 0 ? (
        <div className="space-y-3">
          {/* Mobile-First Cards */}
          <div className="grid grid-cols-1 gap-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-slate-900 text-sm">{p.planName}</span>
                    <Badge status={p.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span className="font-black text-emerald-700 text-sm">₱{p.amount.toLocaleString()}</span>
                    <span>•</span>
                    <span>{formatDateTime(p.submittedAt)}</span>
                  </div>
                  {p.rejectionReason && (
                    <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                      Reason: {p.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {p.screenshotUrl ? (
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Receipt</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs font-semibold">Over-the-Counter</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-emerald-100 p-8 space-y-3 shadow-sm">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 font-heading">No payment records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you subscribe to a bus pass via GCash, your submitted receipt and cashier approval status will appear here.
          </p>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title={`Payment Receipt - ${selectedReceipt.planName}`}
        >
          <div className="space-y-4">
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Amount</span>
                <span className="font-black text-slate-900 font-mono text-sm">
                  ₱{selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Status</span>
                <Badge status={selectedReceipt.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Submitted</span>
                <span className="font-semibold text-slate-700">
                  {formatDateTime(selectedReceipt.submittedAt)}
                </span>
              </div>
              {selectedReceipt.reviewedBy && (
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Reviewed By</span>
                  <span className="font-semibold text-slate-700">{selectedReceipt.reviewedBy}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 flex items-center justify-center bg-slate-900">
              <img
                src={selectedReceipt.screenshotUrl}
                alt="GCash Payment Receipt"
                className="max-h-96 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
