import React, { useState, useEffect } from 'react';
import { Copy, Check, ShieldAlert, Sparkles, Send, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { ImageUpload } from '../common/ImageUpload';
import { SubscriptionPlan, GCashSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getGCashSettings, submitGCashPayment } from '../../services/db';
import { BRANDING } from '../../constants/branding';

interface MakePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  onSuccess?: () => void;
}

export const MakePaymentModal: React.FC<MakePaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const [gcashSettings, setGcashSettings] = useState<GCashSettings | null>(null);
  const [screenshot, setScreenshot] = useState<File | string>('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getGCashSettings().then(setGcashSettings);
  }, []);

  if (!userProfile) return null;

  const handleCopyNumber = () => {
    if (gcashSettings?.gcashMobileNumber) {
      navigator.clipboard.writeText(gcashSettings.gcashMobileNumber.replace(/\D/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot) {
      setErrorMessage('Please upload a screenshot or photo of your GCash payment receipt.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitGCashPayment({
        passengerId: userProfile.uid,
        passengerNumber: userProfile.passengerNumber || 'PAS-000001',
        passengerName: userProfile.fullName,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        screenshotFileOrUrl: screenshot,
      });

      // Confetti effect on successful submission
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passengerNumber = userProfile.passengerNumber || 'PAS-000001';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Subscribe via GCash Payment" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Selected Plan Summary Card */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-emerald-900">
          <div>
            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
              Selected Subscription
            </span>
            <h4 className="text-base font-black text-white font-heading">{plan.name}</h4>
            <p className="text-xs text-slate-300">
              Valid for {plan.durationDays} {plan.durationDays === 1 ? 'day' : 'days'} unli-rides across DCPC routes
            </p>
            <p className="text-[11px] text-emerald-300 mt-1 font-semibold flex items-center gap-1">
              <span>🔄</span> Seamless Extension: If you have an active pass, the new duration extends from your current expiration date!
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <span className="text-[11px] text-slate-400 block font-semibold">Total Amount</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              ₱{plan.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Official GCash Details Box */}
        <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              GC
            </div>
            <div>
              <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wider font-heading">
                Official DCPC Transport Coop GCash
              </h5>
              <p className="text-xs text-emerald-800">Send exact amount to verified cooperative merchant</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Account Name</span>
              <span className="text-xs font-black text-slate-900 font-heading">
                {gcashSettings?.gcashAccountName || 'DCPC TRANSPORT COOP'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">GCash Number</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-700 font-mono">
                  {gcashSettings?.gcashMobileNumber || '0917-888-2877'}
                </span>
                <button
                  type="button"
                  id="copy-gcash-number-btn"
                  onClick={handleCopyNumber}
                  className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                  title="Copy GCash number"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step Instructions */}
          <div className="text-xs text-slate-600 bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1">
            <p className="font-extrabold text-slate-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> GCash Transfer Steps:
            </p>
            <p>1. Open GCash app & tap <strong>Send Money → Express Send</strong>.</p>
            <p>
              2. Transfer exactly <strong>₱{plan.price.toLocaleString()}</strong> to the number above.
            </p>
            <p>
              3. In the message box, type your Passenger ID: <strong className="text-emerald-700 font-mono">{passengerNumber}</strong>.
            </p>
            <p>4. Take a screenshot of the GCash receipt & upload below for Cashier approval.</p>
          </div>
        </div>

        {/* Screenshot Upload */}
        <ImageUpload
          label="Upload Payment Screenshot / Receipt Proof"
          helperText="Upload the clear transaction receipt from your GCash app."
          onChange={(fileOrBase64) => setScreenshot(fileOrBase64)}
          aspectRatio="receipt"
        />

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="submit-gcash-payment-btn"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Submitting Proof...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Submit Payment for Review
              </span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
