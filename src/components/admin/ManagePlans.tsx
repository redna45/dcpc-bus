import React, { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, XCircle, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { SubscriptionPlan } from '../../types';
import { getSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan } from '../../services/db';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const ManagePlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [durationDays, setDurationDays] = useState<number | ''>(30);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getSubscriptionPlans();
      setPlans(data);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setPrice('');
    setDurationDays(30);
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setPrice(plan.price);
    setDurationDays(plan.durationDays);
    setIsActive(plan.isActive);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || Number(price) <= 0 || durationDays === '' || Number(durationDays) <= 0) {
      setError('Please fill in all plan details with positive numbers for price and duration.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, {
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          durationDays: Number(durationDays),
          isActive,
        });
      } else {
        await createSubscriptionPlan({
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          durationDays: Number(durationDays),
          isActive,
        });
      }
      setModalOpen(false);
      await loadPlans();
    } catch (err: any) {
      console.error('Error saving plan:', err);
      setError(err.message || 'Failed to save plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (plan: SubscriptionPlan) => {
    try {
      await updateSubscriptionPlan(plan.id, { isActive: !plan.isActive });
      await loadPlans();
    } catch (err) {
      console.error('Error toggling plan:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Manage Subscription Plans</h2>
          <p className="text-xs text-slate-500">
            Create, price, and adjust commuter ride packages and duration passes.
          </p>
        </div>
        <button
          id="create-new-plan-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Create New Plan
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading subscription plans...
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs space-y-4 flex flex-col justify-between transition ${
                plan.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {plan.durationDays} {plan.durationDays === 1 ? 'Day' : 'Days'} Pass
                  </span>
                  <Badge status={plan.isActive ? 'active' : 'expired'} size="sm" />
                </div>

                <h3 className="text-base font-black text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{plan.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rate</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    ₱{plan.price.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(plan)}
                    className={`p-2 rounded-lg text-xs font-bold transition ${
                      plan.isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                    title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                  >
                    {plan.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No subscription plans created</h3>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Create First Plan
          </button>
        </div>
      )}

      {/* Plan Form Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Plan Name
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly Commuter Pass"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description / Coverage
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Unlimited rides across all EDSA carousel routes for 30 days."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Price in PHP (₱)
                </label>
                <input
                  type="number"
                  placeholder="1500"
                  min="1"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  placeholder="30"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-plan-active-check"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="is-plan-active-check" className="text-xs font-semibold text-slate-800">
                Active & Visible to Passengers for Purchase
              </label>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-plan-btn"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                {isSubmitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Publish Plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
