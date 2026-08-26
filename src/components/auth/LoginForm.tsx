import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleIcon } from '../common/GoogleIcon';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
            Password
          </label>
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
