import React, { useEffect, useState } from 'react';
import { History, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Subscription } from '../../types';
import { getPassengerSubscriptions } from '../../services/db';
import { formatDate, isSubscriptionActive, getRemainingDays } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';

export const PassengerSubscriptions: React.FC = () => {
  const { userProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    getPassengerSubscriptions(userProfile.uid).then((list) => {
      setSubscriptions(list);
      setLoading(false);
    });
  }, [userProfile]);

  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">My Ride Subscription History</h2>
        <p className="text-xs text-slate-500">Record of all past and active transit passes</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Loading subscriptions...
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => {
            const active = isSubscriptionActive(sub);
            const daysLeft = sub.expiryDate ? getRemainingDays(sub.expiryDate) : 0;

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs space-y-3 transition ${
                  active ? 'border-emerald-300 ring-2 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      {sub.paymentMethod} Payment
                    </span>
                    <h3 className="text-base font-black text-slate-900">{sub.planNameSnapshot}</h3>
                  </div>
                  <Badge status={active ? 'active' : sub.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">Valid From</span>
                    <span className="font-bold text-slate-800">{formatDate(sub.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Valid Until</span>
                    <span className={`font-bold ${active ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {formatDate(sub.expiryDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-mono font-bold text-slate-900">₱{sub.price.toLocaleString()}</span>
                  {active ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> {daysLeft} Days Remaining
                    </span>
                  ) : (
                    <span className="text-slate-400">Pass Expired</span>
                  )}
                </div>

                {sub.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 px-2.5 py-1 rounded-md">
                    Note: {sub.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No subscription history</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not enrolled in any bus ride subscriptions yet.
          </p>
        </div>
      )}
    </div>
  );
};
