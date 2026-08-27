import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertTriangle, RefreshCw, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EmailVerificationBanner: React.FC = () => {
  const { currentUser, sendVerificationEmail, reloadUser } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // If not logged in, or already email-verified, or dismissed, do not render
  if (!currentUser || currentUser.emailVerified || dismissed || verifiedSuccess) {
    return null;
  }

  // Google and other OAuth providers auto-verify emails; only show if not verified
  const handleResend = async () => {
    setIsSending(true);
    setErrorMsg(null);
    setSentSuccess(false);
    try {
      await sendVerificationEmail();
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification email.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setErrorMsg(null);
    try {
      const isVerified = await reloadUser();
      if (isVerified) {
        setVerifiedSuccess(true);
        setTimeout(() => setDismissed(true), 3000);
      } else {
        setErrorMsg('Email not verified yet. Please check your inbox and click the confirmation link.');
        setTimeout(() => setErrorMsg(null), 5000);
      }
    } catch (err: any) {
      setErrorMsg('Could not verify status. Please try again.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-amber-500 text-slate-950 border-b border-amber-600/30 px-3 sm:px-6 py-2.5 shadow-xs relative z-30 animate-in fade-in">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-950/10 flex items-center justify-center shrink-0">
            <Mail className="w-3.5 h-3.5 text-amber-950" />
          </div>
          <div>
            <span className="font-bold text-amber-950">Confirm Your Email:</span>{' '}
            <span>
              A confirmation link was sent to <strong className="font-mono text-slate-950 underline">{currentUser.email}</strong>.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
          {sentSuccess && (
            <span className="text-[11px] font-black text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-900" />
              Link sent!
            </span>
          )}

          {errorMsg && (
            <span className="text-[11px] font-bold text-rose-950 bg-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-900" />
              {errorMsg}
            </span>
          )}

          <button
            type="button"
            id="resend-verification-email-btn"
            onClick={handleResend}
            disabled={isSending}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            {isSending ? 'Sending...' : 'Resend Link'}
          </button>

          <button
            type="button"
            id="check-verified-email-btn"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="px-2.5 py-1 bg-amber-100 hover:bg-white text-slate-900 border border-amber-400 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            I've Verified
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-800 hover:text-black rounded-lg hover:bg-amber-400/50 cursor-pointer ml-1"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
