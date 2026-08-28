import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Sparkles, ShieldCheck, Zap, Bus, MapPin } from 'lucide-react';
import { SubscriptionPlan } from '../../types';
import { getSubscriptionPlans } from '../../services/db';
import { MakePaymentModal } from './MakePaymentModal';
import { BRANDING } from '../../constants/branding';

interface BrowsePlansProps {
  onNavigate?: (view: string) => void;
  onSelectPlan?: (plan?: any) => void;
}

export const BrowsePlans: React.FC<BrowsePlansProps> = ({ onNavigate, onSelectPlan }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    getSubscriptionPlans(true).then((p) => {
      setPlans(p);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold mb-2 border border-emerald-200">
            <Bus className="w-3.5 h-3.5 text-emerald-600" />
            <span>{BRANDING.name} • {BRANDING.location}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
            Choose Your Unli-Ride Pass
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enjoy unlimited bus rides across Naga City, Del Rosario, and Bicol networks. Fast approval via GCash reference payment.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan, index) => {
            const isFeatured = plan.durationDays === 30 || index === 1;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ${
                  isFeatured
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white shadow-xl ring-2 ring-emerald-500 hover:-translate-y-1'
                    : 'bg-white text-slate-900 border border-emerald-100 shadow-sm hover:border-emerald-300 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-6 px-3 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                    Recommended Pass
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider font-mono ${
                        isFeatured
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {plan.durationDays} {plan.durationDays === 1 ? 'Day Pass' : 'Days Pass'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">Unli-Rides</span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black font-heading">{plan.name}</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isFeatured ? 'text-slate-300' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/20">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono">₱{plan.price.toLocaleString()}</span>
                      <span className={`text-xs ${isFeatured ? 'text-slate-400' : 'text-slate-500'}`}>
                        / {plan.durationDays} days
                      </span>
                    </div>
                  </div>

                  {/* Plan Features */}
                  <ul className="space-y-2 text-xs pt-2">
                    <li className="flex items-center gap-2">
                      <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span>Unlimited rides on all DCPC modern buses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span>Priority camera QR scan at boarding</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span>Instant digital card + printable ID badge</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/20">
                  <button
                    id={`select-plan-btn-${plan.id}`}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full py-3 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ${
                      isFeatured
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Subscribe via GCash</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-emerald-100 p-8 space-y-3">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 font-heading">No active subscription plans available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please check back soon or ask the cashier/admin at {BRANDING.name} Terminal ({BRANDING.contactNumber}).
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlan && (
        <MakePaymentModal
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
          onSuccess={() => {
            setSelectedPlan(null);
            if (typeof onNavigate === 'function') {
              onNavigate('payments');
            } else if (typeof onSelectPlan === 'function') {
              onSelectPlan(selectedPlan);
            }
          }}
        />
      )}
    </div>
  );
};
