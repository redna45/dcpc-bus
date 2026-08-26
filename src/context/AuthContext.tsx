import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  updateUserRole,
  generateDesignatedId,
  generatePassengerNumber,
  seedInitialDatabaseIfEmpty,
  uploadImage,
} from '../services/db';
import { UserProfile, UserRole } from '../types';

export const SUPER_ADMIN_EMAILS = ['sanderbedana1@gmail.com'];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  activeRole: UserRole;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<UserProfile>;
  registerPassenger: (data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    photoFileOrUrl?: File | string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRoleForDemo: (newRole: UserRole) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminViewRole, setAdminViewRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize DB seeds if empty
  useEffect(() => {
    seedInitialDatabaseIfEmpty();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      let profile = await getUserProfile(currentUser.uid);
      if (profile) {
        if (isSuperAdminEmail(profile.email) && profile.role !== 'admin') {
          await updateUserRole(currentUser.uid, 'admin');
          profile = { ...profile, role: 'admin' };
        }
        setUserProfile(profile);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const isTargetAdmin = isSuperAdminEmail(user.email);
          let profile = await getUserProfile(user.uid);

          if (!profile) {
            // First time user profile creation
            const designatedId = await generateDesignatedId(isTargetAdmin ? 'admin' : 'passenger');
            profile = await createUserProfile({
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || user.email?.split('@')[0] || (isTargetAdmin ? 'Administrator' : 'Bus Rider'),
              mobileNumber: '+63 900 000 0000',
              photoUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.uid)}`,
              role: isTargetAdmin ? 'admin' : 'passenger',
              passengerNumber: designatedId,
            });
          } else {
            let needsUpdate = false;
            const updates: Partial<UserProfile> = {};

            if (isTargetAdmin && profile.role !== 'admin') {
              updates.role = 'admin';
              profile = { ...profile, role: 'admin' };
              needsUpdate = true;
            }

            if (!profile.passengerNumber) {
              const designatedId = await generateDesignatedId(profile.role);
              updates.passengerNumber = designatedId;
              profile = { ...profile, passengerNumber: designatedId };
              needsUpdate = true;
            }

            if (needsUpdate) {
              await updateUserProfile(user.uid, updates);
            }
          }

          setUserProfile(profile);
          // Default admin view role to actual role
          setAdminViewRole(profile.role === 'admin' ? (adminViewRole || 'admin') : null);
        } catch (err: any) {
          console.error('Error fetching user profile in auth listener:', err);
        }
      } else {
        setUserProfile(null);
        setAdminViewRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      let profile = await getUserProfile(user.uid);
      if (profile) {
        if (isSuperAdminEmail(profile.email) && profile.role !== 'admin') {
          await updateUserRole(user.uid, 'admin');
          profile = { ...profile, role: 'admin' };
        }
        setUserProfile(profile);
        if (profile.role === 'admin') setAdminViewRole('admin');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again later.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const isTargetAdmin = isSuperAdminEmail(user.email);

      let profile = await getUserProfile(user.uid);
      if (!profile) {
        // Automatically generate unique sequential passenger number (BUS-000001) for new Google sign-in passenger
        const passengerNumber = await generatePassengerNumber();
        const fallbackName = user.displayName || user.email?.split('@')[0] || (isTargetAdmin ? 'Administrator' : 'Bus Rider');
        const fallbackPhoto = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.uid)}`;

        profile = await createUserProfile({
          uid: user.uid,
          email: user.email || '',
          fullName: fallbackName,
          mobileNumber: user.phoneNumber || '+63 900 000 0000',
          photoUrl: fallbackPhoto,
          role: isTargetAdmin ? 'admin' : 'passenger',
          passengerNumber,
        });
      } else if (isTargetAdmin && profile.role !== 'admin') {
        await updateUserRole(user.uid, 'admin');
        profile = { ...profile, role: 'admin' };
      }

      setUserProfile(profile);
      setCurrentUser(user);
      if (profile.role === 'admin') setAdminViewRole('admin');
      return profile;
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      let msg = 'Google Sign-In failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Sign-in request was cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Sign-in popup was blocked by your browser. Please allow popups for this page.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized in Firebase Auth settings.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerPassenger = async (data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    photoFileOrUrl?: File | string;
  }): Promise<UserProfile> => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      const isTargetAdmin = isSuperAdminEmail(data.email);

      // Handle photo upload
      let photoUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.fullName)}`;
      if (data.photoFileOrUrl) {
        photoUrl = await uploadImage(data.photoFileOrUrl, `profiles/${user.uid}_${Date.now()}`);
      }

      await updateProfile(user, {
        displayName: data.fullName,
        photoURL: photoUrl,
      });

      // Generate unique sequential passenger number (BUS-000001)
      const passengerNumber = await generatePassengerNumber();

      const newProfile = await createUserProfile({
        uid: user.uid,
        email: data.email,
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        photoUrl,
        role: isTargetAdmin ? 'admin' : 'passenger',
        passengerNumber,
      });

      setUserProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      setAdminViewRole(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Only Administrator can switch role view or impersonate other roles to access any module
  const switchRoleForDemo = async (newRole: UserRole) => {
    if (userProfile && userProfile.role === 'admin') {
      setAdminViewRole(newRole);
    }
  };

  const clearError = () => setError(null);

  // Determine active effective role
  const isAdmin = userProfile?.role === 'admin';
  const activeRole: UserRole = isAdmin ? (adminViewRole || 'admin') : (userProfile?.role || 'passenger');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        activeRole,
        isAdmin,
        loading,
        error,
        login,
        loginWithGoogle,
        registerPassenger,
        logout,
        refreshProfile,
        switchRoleForDemo,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

