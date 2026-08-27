import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleIcon } from '../common/GoogleIcon';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, loginWithGoogle, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address to receive reset instructions.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setResetSentSuccess(false);

    try {
      await sendPasswordReset(email.trim());
      setResetSentSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Forgot Password View
  // -------------------------------------------------------------
  if (mode === 'forgot-password') {
    return (
      <div className="space-y-4 text-left font-sans animate-in fade-in">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Reset Your Password</h3>
            <p className="text-[11px] text-slate-500">
              We will email you a secure link to create a new password.
            </p>
          </div>
        </div>

        {resetSentSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold">Password Reset Email Sent!</p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  We sent a reset link to <strong className="font-semibold">{email.trim()}</strong>. Please check your inbox and spam folder, then follow the instructions to set a new password.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="back-to-login-after-reset-btn"
              onClick={() => {
                setResetSentSuccess(false);
                setMode('login');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Your Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="juan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              id="send-password-reset-btn"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <span>Sending Reset Link...</span>
              ) : (
                <>
                  <span>Send Password Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                id="cancel-forgot-password-btn"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Regular Sign In View
  // -------------------------------------------------------------
  return (
    <div className="space-y-4 text-left font-sans">
      {/* Google Sign In Button */}
      <button
        type="button"
        id="google-signin-btn"
        disabled={isGoogleSubmitting || isSubmitting}
        onClick={handleGoogleSignIn}
        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
      >
        {isGoogleSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting Google Account...</span>
          </div>
        ) : (
          <>
            <GoogleIcon className="w-4 h-4 shrink-0" />
            <span>Sign in with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="shrink-0 mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          or continue with email
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              placeholder="juan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <button
              type="button"
              id="forgot-password-toggle-btn"
              onClick={() => {
                setError(null);
                setResetSentSuccess(false);
                setMode('forgot-password');
              }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          id="login-submit-btn"
          disabled={isSubmitting || isGoogleSubmitting}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          {isSubmitting ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Pass Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 pt-1">
          New commuter?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-extrabold text-emerald-700 hover:underline cursor-pointer"
          >
            Create account & get QR pass
          </button>
        </p>
      </form>
    </div>
  );
};

