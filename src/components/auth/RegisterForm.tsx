import React, { useState } from 'react';
import { User, Mail, Phone, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ImageUpload } from '../common/ImageUpload';
import { GoogleIcon } from '../common/GoogleIcon';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { registerPassenger, loginWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState<File | string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Please enter a valid mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerPassenger({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        photoFileOrUrl: photo || undefined,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to register with Google.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left font-sans">
      {/* Google Quick Sign-Up */}
      <button
        type="button"
        id="google-register-btn"
        disabled={isGoogleSubmitting || isSubmitting}
        onClick={handleGoogleSignUp}
        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
      >
        {isGoogleSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Creating Commuter Pass via Google...</span>
          </div>
        ) : (
          <>
            <GoogleIcon className="w-4 h-4 shrink-0" />
            <span>Sign up with Google (Instant Pass)</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="shrink-0 mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          or fill registration form
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
            Full Legal Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. Maria Santos"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="maria@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                placeholder="0917-123-4567"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                minLength={6}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Profile Photo Upload */}
        <ImageUpload
          label="Passenger ID Profile Photo"
          helperText="Upload a clear face photo. Bus checkers will inspect this during boarding."
          onChange={(fileOrBase64) => setPhoto(fileOrBase64)}
          aspectRatio="square"
        />

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          id="register-submit-btn"
          disabled={isSubmitting || isGoogleSubmitting}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          {isSubmitting ? (
            <span>Generating Passenger Number & QR Pass...</span>
          ) : (
            <>
              <span>Register & Get Digital Bus Pass</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 pt-1">
          Already have a commuter account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-extrabold text-emerald-700 hover:underline cursor-pointer"
          >
            Sign In here
          </button>
        </p>
      </form>
    </div>
  );
};
