import React, { useState, useEffect } from 'react';
import { Layers, Search, Filter } from 'lucide-react';
import { Subscription } from '../../types';
import { getAllSubscriptions } from '../../services/db';
import { formatDate, isSubscriptionActive, getRemainingDays } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';

export const CashierSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getAllSubscriptions().then((list) => {
      setSubscriptions(list);
      setLoading(false);
    });
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Active & Expired Subscriptions</h2>
          <p className="text-xs text-slate-500">Overview of all system passenger pass records</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              All ({subscriptions.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'expired' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Expired
            </button>
          </div>

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
                  <th className="px-6 py-3.5">Status</th>
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
                      <td className="px-6 py-4">
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
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No subscriptions found</h3>
          <p className="text-xs text-slate-500">No records match your selected filter.</p>
        </div>
      )}
    </div>
  );
};
