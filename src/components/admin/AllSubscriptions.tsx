import React, { useState, useEffect } from 'react';
import { Layers, Search, Filter, ShoppingBag } from 'lucide-react';
import { Subscription, UserProfile } from '../../types';
import { getAllSubscriptions, getPassengers } from '../../services/db';
import { formatDate, isSubscriptionActive } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';
import { SellSubscriptionModal } from '../cashier/SellSubscriptionModal';

export const AllSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const list = await getAllSubscriptions();
      setSubscriptions(list);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const filtered = subscriptions.filter((s) => {
    const active = isSubscriptionActive(s);
    if (filter === 'active' && !active) return false;
    if (filter === 'expired' && active) return false;

    const term = searchTerm.toLowerCase();
    return (
      s.passengerName.toLowerCase().includes(term) ||
      s.passengerNumber.toLowerCase().includes(term) ||
      s.planNameSnapshot.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">System Pass Subscriptions</h2>
          <p className="text-xs text-slate-500">
            Complete list of active, expired, and pending commuter subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSellModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Sell Pass
          </button>
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({subscriptions.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'active'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active ({subscriptions.filter(isSubscriptionActive).length})
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'expired'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Expired ({subscriptions.filter((s) => !isSubscriptionActive(s)).length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Loading subscriptions...
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Passenger</th>
                  <th className="px-6 py-3.5">Plan Name</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Valid From</th>
                  <th className="px-6 py-3.5">Expiry Date</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const active = isSubscriptionActive(s);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{s.passengerName}</p>
                        <span className="font-mono text-[11px] font-bold text-indigo-700">
                          {s.passengerNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{s.planNameSnapshot}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(s.startDate)}</td>
                      <td className="px-6 py-4">
                        <span className={active ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                          {formatDate(s.expiryDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge status={active ? 'active' : 'expired'} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 text-xs text-slate-400">
          No subscriptions found for this filter.
        </div>
      )}

      {showSellModal && (
        <SellSubscriptionModal
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSuccess={loadSubscriptions}
        />
      )}
    </div>
  );
};
