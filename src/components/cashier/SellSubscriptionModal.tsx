import React, { useState, useEffect } from 'react';
import { Search, User, CreditCard, Banknote, CheckCircle, AlertCircle, ShoppingBag, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { UserProfile, SubscriptionPlan, PaymentMethod, Subscription } from '../../types';
import {
  searchPassengers,
  getSubscriptionPlans,
  sellSubscriptionManually,
  findPassengerByNumber,
  getPassengerCoverageSummary,
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, calculateExpiryDate } from '../../lib/dateUtils';

interface SellSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPassenger?: UserProfile | null;
  onSuccess?: () => void;
}

export const SellSubscriptionModal: React.FC<SellSubscriptionModalProps> = ({
  isOpen,
  onClose,
  initialPassenger,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<UserProfile | null>(initialPassenger || null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Active pass continuation details
  const [passengerCoverage, setPassengerCoverage] = useState<{
    activeSub: Subscription | null;
    continuationSubs: Subscription[];
    latestExpiryDate: string | null;
    totalDaysLeft: number;
  } | null>(null);

  useEffect(() => {
    getSubscriptionPlans(true).then((p) => {
      setPlans(p);
      if (p.length > 0) setSelectedPlanId(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (initialPassenger) {
      setSelectedPassenger(initialPassenger);
    }
  }, [initialPassenger]);

  // Load coverage info when passenger changes
  useEffect(() => {
    if (selectedPassenger) {
      getPassengerCoverageSummary(selectedPassenger.uid).then(setPassengerCoverage);
    } else {
      setPassengerCoverage(null);
    }
  }, [selectedPassenger]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const q = searchQuery.trim().toUpperCase();
      if (q.startsWith('PAS-') || q.startsWith('BUS-')) {
        const found = await findPassengerByNumber(searchQuery.trim());
        setSearchResults(found ? [found] : []);
      } else {
        const results = await searchPassengers(searchQuery);
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPassenger) {
      setError('Please select a passenger first.');
      return;
    }
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) {
      setError('Please choose a valid subscription plan.');
      return;
    }
    if (!userProfile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sellSubscriptionManually({
        passenger: selectedPassenger,
        plan,
        paymentMethod,
        creatorUid: userProfile.uid,
        creatorName: userProfile.fullName,
        notes: notes.trim() || undefined,
      });

      try {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      } catch {}

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Manual sell error:', err);
      setError(err.message || 'Failed to sell subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sell / Activate Subscription" maxWidth="lg">
      <form onSubmit={handleSell} className="space-y-5">
        {/* Step 1: Select Passenger */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Passenger Lookup
          </label>

          {selectedPassenger ? (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPassenger.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPassenger.fullName}`}
                  alt={selectedPassenger.fullName}
                  className="w-10 h-10 rounded-xl object-cover border border-indigo-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{selectedPassenger.fullName}</h4>
                  <p className="text-[11px] font-mono font-bold text-indigo-700">
                    {selectedPassenger.passengerNumber || 'PAS-000001'}
                  </p>
                  <p className="text-[10px] text-slate-500">{selectedPassenger.mobileNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPassenger(null)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by PAS-XXXXXX, name, or phone number"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {searchResults.map((p) => (
                    <div
                      key={p.uid}
                      onClick={() => setSelectedPassenger(p)}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={p.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.fullName}`}
                          alt={p.fullName}
                          className="w-7 h-7 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.fullName}</p>
                          <p className="text-[10px] text-slate-500">{p.mobileNumber}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {p.passengerNumber}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Choose Plan */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Select Subscription Plan
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plans.map((p) => (
              <label
                key={p.id}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  selectedPlanId === p.id
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="plan"
                    checked={selectedPlanId === p.id}
                    onChange={() => setSelectedPlanId(p.id)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.durationDays} Days Duration</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-black text-slate-900">
                  ₱{p.price.toLocaleString()}
                </span>
              </label>
            ))}
          </div>

          {/* Active Card Continuation Alert */}
          {selectedPassenger && passengerCoverage && passengerCoverage.latestExpiryDate && selectedPlan && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
              <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-950 uppercase text-[11px] tracking-wide">
                    🔄 Active Card Continuation Detected
                  </span>
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {passengerCoverage.totalDaysLeft} Days Remaining
                  </span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Passenger currently has active pass coverage until{' '}
                  <strong>{formatDate(passengerCoverage.latestExpiryDate)}</strong>.
                  Activating this {selectedPlan.name} will seamlessly stack from that date, extending total coverage until{' '}
                  <strong className="text-amber-950 underline decoration-amber-400">
                    {formatDate(
                      calculateExpiryDate(passengerCoverage.latestExpiryDate, selectedPlan.durationDays)
                    )}
                  </strong>{' '}
                  (+{selectedPlan.durationDays} days).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Payment Method & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              3. Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Cash">Cash (Counter / Terminal)</option>
              <option value="GCash">GCash (Counter Verified)</option>
              <option value="Manual">Manual / Promotional / Voucher</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Staff Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Counter terminal 1 sale"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Total & Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total to Collect</span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {selectedPlan ? `₱${selectedPlan.price.toLocaleString()}` : '₱0'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="activate-subscription-btn"
              disabled={isSubmitting || !selectedPassenger}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <ShoppingBag className="w-4 h-4" />
              {isSubmitting ? 'Activating...' : 'Activate Subscription Now'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
