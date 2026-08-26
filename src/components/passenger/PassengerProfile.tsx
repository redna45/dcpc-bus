import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Shield, Camera, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, uploadImage } from '../../services/db';
import { ImageUpload } from '../common/ImageUpload';
import { formatDate } from '../../lib/dateUtils';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const PassengerProfile: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(userProfile?.mobileNumber || '');
  const [photo, setPhoto] = useState<File | string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      setMobileNumber(userProfile.mobileNumber || '');
    }
  }, [userProfile?.uid, userProfile?.fullName, userProfile?.mobileNumber]);

  if (!userProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Please provide your mobile contact number.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      let finalPhotoUrl = userProfile.photoUrl || '';
      if (photo) {
        finalPhotoUrl = await uploadImage(photo, `profiles/${userProfile.uid}_${Date.now()}`);
      }

      // Update Firestore user document
      await updateUserProfile(userProfile.uid, {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        photoUrl: finalPhotoUrl,
      });

      // Update Firebase Auth user profile if signed in
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: fullName.trim(),
            photoURL: finalPhotoUrl.startsWith('data:') ? undefined : finalPhotoUrl,
          });
        } catch (authErr) {
          console.warn('Firebase Auth updateProfile non-critical notice:', authErr);
        }
      }

      await refreshProfile();
      setPhoto('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const passengerNumber = userProfile.passengerNumber || 'BUS-000001';
  const currentAvatar =
    (typeof photo === 'string' && photo.startsWith('data:') ? photo : userProfile.photoUrl) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile.fullName)}`;

  return (
    <div className="max-w-xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-6">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 font-heading tracking-tight">
          Passenger Profile & Pass Info
        </h2>
        <p className="text-xs text-slate-500">Manage your contact details and registered photo</p>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-100 shadow-sm space-y-5">
        {/* Top Info Banner */}
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
          <img
            src={currentAvatar}
            alt={userProfile.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-200 shadow-xs bg-slate-100 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {passengerNumber}
              </span>
              <span className="text-[10px] uppercase font-extrabold text-slate-400">Coop Commuter</span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-1 font-heading truncate">
              {fullName || userProfile.fullName}
            </h3>
            <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Contact Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                placeholder="0900 000 0000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Email Address (Account ID)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={userProfile.email}
                disabled
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <ImageUpload
            label="Update Profile Photo"
            helperText="Clear face photo used by bus checkers to visually verify identity."
            value={userProfile.photoUrl}
            onChange={(fileOrBase64) => setPhoto(fileOrBase64)}
            aspectRatio="square"
          />

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Registered on {formatDate(userProfile.createdAt)}
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
