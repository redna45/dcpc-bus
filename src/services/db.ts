import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore';
import { initializeApp as initSecondaryApp, deleteApp as deleteSecondaryApp } from 'firebase/app';
import {
  getAuth as getSecondaryAuth,
  createUserWithEmailAndPassword as createSecondaryUser,
  signOut as secondarySignOut,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, firebaseConfig } from '../lib/firebase';
import { compressAndResizeImage } from '../lib/imageUtils';
import {
  UserProfile,
  SubscriptionPlan,
  Subscription,
  PaymentRecord,
  VerificationLog,
  CompanySettings,
  GCashSettings,
  VerificationResultData,
  PaymentMethod,
  UserRole,
} from '../types';
import { calculateExpiryDate, isSubscriptionActive } from '../lib/dateUtils';

// ==========================================
// DESIGNATED ID GENERATION (PAS/CSH/CHK/ADM)
// ==========================================
export async function generateDesignatedId(role: UserRole): Promise<string> {
  const prefixMap: Record<UserRole, { prefix: string; counterName: string }> = {
    passenger: { prefix: 'PAS', counterName: 'passengers' },
    cashier: { prefix: 'CSH', counterName: 'cashiers' },
    checker: { prefix: 'CHK', counterName: 'checkers' },
    admin: { prefix: 'ADM', counterName: 'admins' },
  };

  const { prefix, counterName } = prefixMap[role] || { prefix: 'PAS', counterName: 'passengers' };
  const counterRef = doc(db, 'counters', counterName);

  let nextNumber = 1;

  try {
    // 1. Check existing users with this prefix to find the true highest assigned sequence number in the database
    let highestUserNumber = 0;
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const docSnap of usersSnap.docs) {
        const uData = docSnap.data();
        const idToCheck = (uData.passengerNumber || uData.designatedId || '') as string;
        if (idToCheck.startsWith(`${prefix}-`)) {
          const numPart = parseInt(idToCheck.replace(`${prefix}-`, ''), 10);
          if (!isNaN(numPart) && numPart > highestUserNumber && numPart < 900000) {
            highestUserNumber = numPart;
          }
        }
      }
    } catch (e) {
      console.warn('Could not scan existing users for highest sequence:', e);
    }

    // 2. Read the dedicated counter document
    let counterValue = 0;
    try {
      const counterSnap = await getDoc(counterRef);
      if (counterSnap.exists()) {
        const data = counterSnap.data();
        counterValue = typeof data.count === 'number' ? data.count : 0;
      }
    } catch (e) {
      console.warn('Could not read counter doc:', e);
    }

    // 3. Compute the next sequential number (max of highest existing user ID + 1 or counter + 1)
    nextNumber = Math.max(highestUserNumber + 1, counterValue > 0 ? counterValue + 1 : 1);

    // 4. Save the updated counter back to Firestore
    try {
      await setDoc(counterRef, { count: nextNumber, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Could not update counter doc:', e);
    }

    return `${prefix}-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.warn(`Sequential ID generation error for ${role}:`, error);
    return `${prefix}-${String(nextNumber).padStart(6, '0')}`;
  }
}

export async function generatePassengerNumber(): Promise<string> {
  return generateDesignatedId('passenger');
}

export function cleanDocData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

// ==========================================
// USER & PASSENGER PROFILE MANAGEMENT
// ==========================================
export async function createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
  const now = new Date().toISOString();
  const userProfile: UserProfile = {
    ...profile,
    createdAt: now,
    updatedAt: now,
  };

  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, cleanDocData(userProfile));
  return userProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    cleanDocData({
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true }
  );
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching all users:', error);
    // Fallback without ordering
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((doc) => doc.data() as UserProfile);
  }
}

export async function getPassengers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'passenger'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching passengers:', error);
    return [];
  }
}

export async function findPassengerByNumber(passengerNumber: string): Promise<UserProfile | null> {
  const cleanNumber = passengerNumber.trim().toUpperCase();
  try {
    const q = query(collection(db, 'users'), where('passengerNumber', '==', cleanNumber), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error finding passenger by number:', error);
    return null;
  }
}

export async function searchPassengers(searchTerm: string): Promise<UserProfile[]> {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];

  const allUsers = await getAllUsers();
  return allUsers.filter(
    (u) =>
      u.role === 'passenger' &&
      ((u.passengerNumber && u.passengerNumber.toLowerCase().includes(term)) ||
        (u.fullName && u.fullName.toLowerCase().includes(term)) ||
        (u.mobileNumber && u.mobileNumber.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)))
  );
}

export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: new Date().toISOString(),
  });
}

export async function createUserByAdmin(data: {
  fullName: string;
  email: string;
  password?: string;
  mobileNumber: string;
  role: UserRole;
  photoUrl?: string;
}): Promise<UserProfile> {
  let uid: string;
  const email = data.email.trim().toLowerCase();

  // If password is provided, create standard Firebase Auth user so they can log in directly
  if (data.password && data.password.trim().length >= 6) {
    const secondaryAppName = `SecondaryAuth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const secondaryApp = initSecondaryApp(firebaseConfig, secondaryAppName);
    try {
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      const userCredential = await createSecondaryUser(secondaryAuth, email, data.password.trim());
      uid = userCredential.user.uid;
      await secondarySignOut(secondaryAuth);
    } catch (authErr: any) {
      console.error('Firebase Auth creation error in admin portal:', authErr);
      let errorMsg = 'Failed to create user login credentials.';
      if (authErr.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email address already exists.';
      } else if (authErr.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (authErr.code === 'auth/invalid-email') {
        errorMsg = 'The email address is invalid.';
      } else if (authErr.message) {
        errorMsg = authErr.message;
      }
      throw new Error(errorMsg);
    } finally {
      try {
        await deleteSecondaryApp(secondaryApp);
      } catch (e) {
        console.warn('Secondary app cleanup note:', e);
      }
    }
  } else {
    // Generate unique custom UID if created without password
    uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Always designate a sequential formatted ID based on role (PAS-000001, CSH-000001, CHK-000001, ADM-000001)
  const designatedId = await generateDesignatedId(data.role);

  const photoUrl =
    data.photoUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.fullName || uid)}`;

  const profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    fullName: data.fullName.trim(),
    mobileNumber: data.mobileNumber.trim() || '+63 900 000 0000',
    photoUrl,
    role: data.role,
    passengerNumber: designatedId,
  };

  const profile = await createUserProfile(profileData);
  return profile;
}

export async function deleteUserByAdmin(uid: string): Promise<void> {
  // 1. Delete user document from users collection
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);

  // 2. Cascade delete subscriptions
  try {
    const subsQ = query(collection(db, 'subscriptions'), where('userId', '==', uid));
    const subsSnap = await getDocs(subsQ);
    for (const d of subsSnap.docs) {
      await deleteDoc(d.ref).catch(() => {});
    }
  } catch (err) {
    console.warn('Note on deleting user subscriptions:', err);
  }

  // 3. Cascade delete payments
  try {
    const paymentsQ = query(collection(db, 'payments'), where('userId', '==', uid));
    const paymentsSnap = await getDocs(paymentsQ);
    for (const d of paymentsSnap.docs) {
      await deleteDoc(d.ref).catch(() => {});
    }
  } catch (err) {
    console.warn('Note on deleting user payments:', err);
  }

  // 4. Cascade delete verifications
  try {
    const verifQ = query(collection(db, 'verifications'), where('passengerId', '==', uid));
    const verifSnap = await getDocs(verifQ);
    for (const d of verifSnap.docs) {
      await deleteDoc(d.ref).catch(() => {});
    }
  } catch (err) {
    console.warn('Note on deleting user verifications:', err);
  }
}

// ==========================================
// IMAGE UPLOAD (STORAGE WITH COMPRESSED BASE64 FALLBACK)
// ==========================================
export async function uploadImage(fileOrDataUrl: File | string, path: string): Promise<string> {
  if (!fileOrDataUrl) return '';

  // If already a remote HTTP/HTTPS URL, return it directly
  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
    return fileOrDataUrl;
  }

  let compressedDataUrl = '';
  let blobToUpload: Blob | null = null;

  try {
    const isSquareProfile = path.includes('profile');
    const maxDim = isSquareProfile ? 500 : 800;
    const quality = isSquareProfile ? 0.8 : 0.75;
    const processed = await compressAndResizeImage(fileOrDataUrl, maxDim, quality);
    compressedDataUrl = processed.dataUrl;
    blobToUpload = processed.blob;
  } catch (err) {
    console.warn('Image preprocessing warning, using original input:', err);
    if (typeof fileOrDataUrl === 'string') {
      compressedDataUrl = fileOrDataUrl;
    }
  }

  // Attempt Firebase Storage upload with a 3.5s timeout race
  try {
    if (blobToUpload) {
      const storageRef = ref(storage, path);
      const uploadPromise = (async () => {
        await uploadBytes(storageRef, blobToUpload!);
        return await getDownloadURL(storageRef);
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timed out')), 1500)
      );

      const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
      if (downloadUrl) return downloadUrl;
    }
  } catch (storageErr) {
    console.warn('Firebase Storage upload bypassed/fallback engaged:', storageErr);
  }

  // Return the lightweight optimized Base64 data URL
  if (compressedDataUrl) {
    return compressedDataUrl;
  }

  // Ultimate fallback
  if (fileOrDataUrl instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  return fileOrDataUrl;
}

// ==========================================
// SUBSCRIPTION PLANS
// ==========================================
export async function getSubscriptionPlans(activeOnly = false): Promise<SubscriptionPlan[]> {
  try {
    const plansRef = collection(db, 'subscriptionPlans');
    const q = activeOnly ? query(plansRef, where('isActive', '==', true)) : plansRef;
    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SubscriptionPlan));
    return plans.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
}

export async function createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt'>): Promise<SubscriptionPlan> {
  const planRef = doc(collection(db, 'subscriptionPlans'));
  const newPlan: SubscriptionPlan = {
    id: planRef.id,
    ...plan,
    createdAt: new Date().toISOString(),
  };
  await setDoc(planRef, newPlan);
  return newPlan;
}

export async function updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<void> {
  const planRef = doc(db, 'subscriptionPlans', id);
  await updateDoc(planRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// ==========================================
// GCASH PAYMENTS & CASHIER APPROVAL
// ==========================================
export async function submitGCashPayment(data: {
  passengerId: string;
  passengerNumber: string;
  passengerName: string;
  planId: string;
  planName: string;
  amount: number;
  screenshotFileOrUrl: File | string;
}): Promise<PaymentRecord> {
  const paymentRef = doc(collection(db, 'payments'));
  const path = `payments/${paymentRef.id}_${Date.now()}`;
  const screenshotUrl = await uploadImage(data.screenshotFileOrUrl, path);

  const payment: PaymentRecord = {
    id: paymentRef.id,
    passengerId: data.passengerId,
    passengerNumber: data.passengerNumber,
    passengerName: data.passengerName,
    planId: data.planId,
    planName: data.planName,
    amount: data.amount,
    paymentMethod: 'GCash',
    screenshotUrl,
    status: 'pending_review',
    submittedAt: new Date().toISOString(),
  };

  await setDoc(paymentRef, payment);

  // Also create a pending subscription record linked to this payment
  const subRef = doc(collection(db, 'subscriptions'));
  const pendingSub: Subscription = {
    id: subRef.id,
    passengerId: data.passengerId,
    passengerNumber: data.passengerNumber,
    passengerName: data.passengerName,
    planId: data.planId,
    planNameSnapshot: data.planName,
    price: data.amount,
    paymentMethod: 'GCash',
    paymentId: paymentRef.id,
    status: 'pending',
    startDate: '',
    expiryDate: '',
    createdAt: new Date().toISOString(),
    notes: 'Awaiting GCash proof review',
  };
  await setDoc(subRef, pendingSub);

  return payment;
}

export async function getPendingPayments(): Promise<PaymentRecord[]> {
  try {
    const q = query(
      collection(db, 'payments'),
      where('status', '==', 'pending_review'),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
  } catch {
    // Fallback without ordering index
    const q = query(collection(db, 'payments'), where('status', '==', 'pending_review'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
  }
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  try {
    const q = query(collection(db, 'payments'), orderBy('submittedAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
  } catch {
    const snapshot = await getDocs(collection(db, 'payments'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
  }
}

export async function getPassengerPayments(passengerId: string): Promise<PaymentRecord[]> {
  try {
    const q = query(collection(db, 'payments'), where('passengerId', '==', passengerId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error getting passenger payments:', error);
    return [];
  }
}

export async function approvePayment(
  paymentId: string,
  reviewerUid: string,
  reviewerName: string,
  planDurationDays: number
): Promise<void> {
  const now = new Date().toISOString();
  const paymentRef = doc(db, 'payments', paymentId);
  const paymentSnap = await getDoc(paymentRef);

  if (!paymentSnap.exists()) {
    throw new Error('Payment record not found');
  }

  const payment = paymentSnap.data() as PaymentRecord;
  if (payment.status !== 'pending_review') {
    throw new Error(`Payment is already ${payment.status}`);
  }

  const startDate = now;
  const expiryDate = calculateExpiryDate(startDate, planDurationDays);

  // Update payment status
  await updateDoc(paymentRef, {
    status: 'approved',
    reviewedAt: now,
    reviewedBy: `${reviewerName} (${reviewerUid})`,
  });

  // Find associated subscription or create new one
  const subQuery = query(collection(db, 'subscriptions'), where('paymentId', '==', paymentId));
  const subSnap = await getDocs(subQuery);

  if (!subSnap.empty) {
    const subDoc = subSnap.docs[0];
    await updateDoc(doc(db, 'subscriptions', subDoc.id), {
      status: 'active',
      startDate,
      expiryDate,
      approvedAt: now,
      approvedBy: `${reviewerName} (${reviewerUid})`,
      notes: 'Approved via GCash verification',
    });
  } else {
    const newSubRef = doc(collection(db, 'subscriptions'));
    await setDoc(newSubRef, {
      id: newSubRef.id,
      passengerId: payment.passengerId,
      passengerNumber: payment.passengerNumber,
      passengerName: payment.passengerName,
      planId: payment.planId,
      planNameSnapshot: payment.planName,
      price: payment.amount,
      paymentMethod: 'GCash',
      paymentId: payment.id,
      status: 'active',
      startDate,
      expiryDate,
      createdAt: now,
      approvedAt: now,
      approvedBy: `${reviewerName} (${reviewerUid})`,
      notes: 'Approved via GCash verification',
    });
  }
}

export async function rejectPayment(
  paymentId: string,
  reviewerUid: string,
  reviewerName: string,
  rejectionReason: string
): Promise<void> {
  const now = new Date().toISOString();
  const paymentRef = doc(db, 'payments', paymentId);
  const paymentSnap = await getDoc(paymentRef);

  if (!paymentSnap.exists()) {
    throw new Error('Payment record not found');
  }

  const payment = paymentSnap.data() as PaymentRecord;
  if (payment.status !== 'pending_review') {
    throw new Error(`Payment is already ${payment.status}`);
  }

  await updateDoc(paymentRef, {
    status: 'rejected',
    reviewedAt: now,
    reviewedBy: `${reviewerName} (${reviewerUid})`,
    rejectionReason: rejectionReason || 'Payment rejected by cashier/admin',
  });

  // Also mark pending subscription rejected
  const subQuery = query(collection(db, 'subscriptions'), where('paymentId', '==', paymentId));
  const subSnap = await getDocs(subQuery);
  if (!subSnap.empty) {
    await updateDoc(doc(db, 'subscriptions', subSnap.docs[0].id), {
      status: 'rejected',
      notes: rejectionReason || 'Payment rejected',
    });
  }
}

// ==========================================
// MANUAL SUBSCRIPTION SALES (CASH / MANUAL)
// ==========================================
export async function sellSubscriptionManually(data: {
  passenger: UserProfile;
  plan: SubscriptionPlan;
  paymentMethod: PaymentMethod;
  creatorUid: string;
  creatorName: string;
  notes?: string;
  customStartDate?: string;
}): Promise<Subscription> {
  const now = new Date().toISOString();
  const startDate = data.customStartDate || now;
  const expiryDate = calculateExpiryDate(startDate, data.plan.durationDays);

  const subRef = doc(collection(db, 'subscriptions'));
  const subscription: Subscription = {
    id: subRef.id,
    passengerId: data.passenger.uid,
    passengerNumber: data.passenger.passengerNumber || 'PAS-000000',
    passengerName: data.passenger.fullName,
    planId: data.plan.id,
    planNameSnapshot: data.plan.name,
    price: data.plan.price,
    paymentMethod: data.paymentMethod,
    status: 'active',
    startDate,
    expiryDate,
    createdAt: now,
    approvedAt: now,
    approvedBy: `${data.creatorName} (${data.creatorUid})`,
    createdBy: `${data.creatorName} (${data.creatorUid})`,
    notes: data.notes || `Manual sale via ${data.paymentMethod}`,
  };

  await setDoc(subRef, subscription);

  // Also log into payments collection for bookkeeping
  const paymentRef = doc(collection(db, 'payments'));
  await setDoc(paymentRef, {
    id: paymentRef.id,
    passengerId: data.passenger.uid,
    passengerNumber: data.passenger.passengerNumber || 'PAS-000000',
    passengerName: data.passenger.fullName,
    planId: data.plan.id,
    planName: data.plan.name,
    amount: data.plan.price,
    paymentMethod: data.paymentMethod,
    screenshotUrl: '',
    status: 'approved',
    submittedAt: now,
    reviewedAt: now,
    reviewedBy: `${data.creatorName} (${data.creatorUid})`,
  });

  return subscription;
}

// ==========================================
// SUBSCRIPTIONS RETRIEVAL
// ==========================================
export async function getPassengerActiveSubscription(passengerId: string): Promise<Subscription | null> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('passengerId', '==', passengerId)
    );
    const snapshot = await getDocs(q);
    const subscriptions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));

    // Find the latest active subscription that hasn't expired
    const activeSubs = subscriptions.filter(isSubscriptionActive);
    if (activeSubs.length > 0) {
      // Sort by latest expiry date
      activeSubs.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
      return activeSubs[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching active subscription:', error);
    return null;
  }
}

export async function getPassengerSubscriptions(passengerId: string): Promise<Subscription[]> {
  try {
    const q = query(collection(db, 'subscriptions'), where('passengerId', '==', passengerId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching passenger subscriptions:', error);
    return [];
  }
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  try {
    const snapshot = await getDocs(collection(db, 'subscriptions'));
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    return [];
  }
}

// ==========================================
// CHECKER VERIFICATION & LOGS
// ==========================================
const recentVerificationsCache = new Map<string, { timestamp: number; result: VerificationResultData }>();

export async function verifyPassenger(
  passengerNumberOrQr: string,
  checkerUid: string,
  checkerName: string,
  busNumber: string = 'BUS-01'
): Promise<VerificationResultData> {
  const rawInput = passengerNumberOrQr.trim();
  // Strip any prefix if scanner captured a URL or extra text
  let passengerNumber = rawInput;
  if (rawInput.includes('PAS-') || rawInput.includes('BUS-')) {
    const match = rawInput.match(/(PAS|BUS)-\d+/i);
    if (match) {
      passengerNumber = match[0].toUpperCase();
    }
  }

  const assignedBus = busNumber.trim().toUpperCase() || 'BUS-01';

  // Deduplicate rapid consecutive scans within 2 seconds for the same passenger by the same checker on same bus
  const cacheKey = `${checkerUid}_${assignedBus}_${passengerNumber}`;
  const cached = recentVerificationsCache.get(cacheKey);
  const currentTime = Date.now();
  if (cached && currentTime - cached.timestamp < 2000) {
    return cached.result;
  }

  const passenger = await findPassengerByNumber(passengerNumber);
  const now = new Date().toISOString();

  if (!passenger) {
    // Log not found
    const logRef = doc(collection(db, 'verifications'));
    const logEntry: VerificationLog = {
      id: logRef.id,
      passengerId: '',
      passengerNumber,
      passengerName: 'Unknown / Unregistered',
      checkerId: checkerUid,
      checkerName,
      busNumber: assignedBus,
      result: 'passenger_not_found',
      timestamp: now,
      notes: `Scanned on bus unit ${assignedBus}`,
    };
    await setDoc(logRef, logEntry);

    const res: VerificationResultData = {
      result: 'passenger_not_found',
      busNumber: assignedBus,
      message: `No passenger registered with number ${passengerNumber}`,
    };
    recentVerificationsCache.set(cacheKey, { timestamp: currentTime, result: res });
    return res;
  }

  // Get passenger subscriptions
  const allSubs = await getPassengerSubscriptions(passenger.uid);
  const activeSub = allSubs.find(isSubscriptionActive);

  if (activeSub) {
    const logRef = doc(collection(db, 'verifications'));
    const logEntry: VerificationLog = {
      id: logRef.id,
      passengerId: passenger.uid,
      passengerNumber: passenger.passengerNumber,
      passengerName: passenger.fullName,
      checkerId: checkerUid,
      checkerName,
      busNumber: assignedBus,
      result: 'valid',
      timestamp: now,
      planName: activeSub.planNameSnapshot,
      expiryDate: activeSub.expiryDate,
      notes: `Verified valid for ${activeSub.planNameSnapshot} on bus ${assignedBus}`,
    };
    await setDoc(logRef, logEntry);

    const res: VerificationResultData = {
      result: 'valid',
      passenger,
      subscription: activeSub,
      busNumber: assignedBus,
    };
    recentVerificationsCache.set(cacheKey, { timestamp: currentTime, result: res });
    return res;
  }

  // Check if there are expired subscriptions
  const expiredSub = allSubs.find((s) => s.status === 'active' || s.status === 'expired');

  if (expiredSub) {
    const logRef = doc(collection(db, 'verifications'));
    const logEntry: VerificationLog = {
      id: logRef.id,
      passengerId: passenger.uid,
      passengerNumber: passenger.passengerNumber,
      passengerName: passenger.fullName,
      checkerId: checkerUid,
      checkerName,
      busNumber: assignedBus,
      result: 'expired',
      timestamp: now,
      planName: expiredSub.planNameSnapshot,
      expiryDate: expiredSub.expiryDate,
      notes: `Expired pass (${expiredSub.planNameSnapshot}) presented on bus ${assignedBus}`,
    };
    await setDoc(logRef, logEntry);

    const res: VerificationResultData = {
      result: 'expired',
      passenger,
      subscription: expiredSub,
      busNumber: assignedBus,
      message: 'Subscription has expired',
    };
    recentVerificationsCache.set(cacheKey, { timestamp: currentTime, result: res });
    return res;
  }

  // No subscription at all
  const logRef = doc(collection(db, 'verifications'));
  const logEntry: VerificationLog = {
    id: logRef.id,
    passengerId: passenger.uid,
    passengerNumber: passenger.passengerNumber,
    passengerName: passenger.fullName,
    checkerId: checkerUid,
    checkerName,
    busNumber: assignedBus,
    result: 'no_active_subscription',
    timestamp: now,
    notes: `No active pass enrolled on bus ${assignedBus}`,
  };
  await setDoc(logRef, logEntry);

  const res: VerificationResultData = {
    result: 'no_active_subscription',
    passenger,
    busNumber: assignedBus,
    message: 'Passenger has no active subscription',
  };
  recentVerificationsCache.set(cacheKey, { timestamp: currentTime, result: res });
  return res;
}

export async function getVerificationLogs(checkerId?: string): Promise<VerificationLog[]> {
  try {
    const verifRef = collection(db, 'verifications');
    let q = query(verifRef, orderBy('timestamp', 'desc'), limit(500));
    if (checkerId) {
      q = query(verifRef, where('checkerId', '==', checkerId), limit(500));
    }
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VerificationLog));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    const snap = await getDocs(collection(db, 'verifications'));
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VerificationLog));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// ==========================================
// SETTINGS (COMPANY & GCASH)
// ==========================================
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'DCPC - BAGONG PAG-ASA TRANSPORT COOPERATIVE',
  contactNumber: '09123427581',
  address: 'PAG-ASA ST VCS DEL ROSARIO NAGA CITY',
  email: 'dcpctransport@gmail.com',
  website: 'https://dcpctransport.ph',
  tagline: 'BAGONG PAG-ASA TRANSPORT COOPERATIVE (EST. 2021)',
};

export const DEFAULT_GCASH_SETTINGS: GCashSettings = {
  gcashAccountName: 'DCPC BAPAGTRANSCO',
  gcashMobileNumber: '09123427581',
  paymentInstructions:
    '1. Open GCash app and tap Send Money -> Express Send.\n2. Enter our GCash number (09123427581) and the exact subscription amount.\n3. In the message box, enter your Passenger Number (e.g. PAS-000001).\n4. Take a clear screenshot of the completed transaction receipt.\n5. Upload the screenshot below to activate your subscription upon cashier review.',
};

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'company'));
    if (snap.exists()) {
      return snap.data() as CompanySettings;
    }
  } catch (error) {
    console.error('Error fetching company settings:', error);
  }
  return DEFAULT_COMPANY_SETTINGS;
}

export async function updateCompanySettings(settings: CompanySettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'company'), settings, { merge: true });
}

export async function getGCashSettings(): Promise<GCashSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'payment'));
    if (snap.exists()) {
      return snap.data() as GCashSettings;
    }
  } catch (error) {
    console.error('Error fetching GCash settings:', error);
  }
  return DEFAULT_GCASH_SETTINGS;
}

export async function updateGCashSettings(settings: GCashSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'payment'), settings, { merge: true });
}

// ==========================================
// INITIAL DATABASE SEEDING
// ==========================================
export async function seedInitialDatabaseIfEmpty(): Promise<void> {
  try {
    // Check if plans exist
    const plansSnap = await getDocs(collection(db, 'subscriptionPlans'));
    if (plansSnap.empty) {
      console.log('Seeding initial subscription plans...');
      const samplePlans = [
        {
          name: 'Day Pass Unlimited',
          description: 'Unlimited bus rides across all city express routes for 24 hours.',
          price: 60,
          durationDays: 1,
          isActive: true,
        },
        {
          name: 'Weekly Commuter Pass',
          description: '7-day unli-ride pass ideal for weekday office commuters.',
          price: 350,
          durationDays: 7,
          isActive: true,
        },
        {
          name: 'Monthly Express Pass',
          description: '30-day comprehensive pass with priority boarding on all city lines.',
          price: 1350,
          durationDays: 30,
          isActive: true,
        },
        {
          name: 'Quarterly Transit Pass',
          description: '90-day discounted seasonal pass for frequent bus riders.',
          price: 3600,
          durationDays: 90,
          isActive: true,
        },
        {
          name: 'Annual VIP Pass',
          description: '365-day all-access bus pass with maximum savings and free replacement ID.',
          price: 12000,
          durationDays: 365,
          isActive: true,
        },
      ];

      for (const p of samplePlans) {
        await createSubscriptionPlan(p);
      }
    }

    // Check settings
    const compSnap = await getDoc(doc(db, 'settings', 'company'));
    if (!compSnap.exists()) {
      await updateCompanySettings(DEFAULT_COMPANY_SETTINGS);
    }

    const gcashSnap = await getDoc(doc(db, 'settings', 'payment'));
    if (!gcashSnap.exists()) {
      await updateGCashSettings(DEFAULT_GCASH_SETTINGS);
    }
  } catch (error) {
    console.warn('Seed operation error (may be fine if already initialized):', error);
  }
}

// ==========================================
// FACTORY RESET & DATABASE PURGE
// ==========================================
export async function restoreFactorySettings(preservedSuperAdminEmail = 'sanderbedana1@gmail.com'): Promise<{
  deletedUsersCount: number;
  deletedSubsCount: number;
  deletedPaymentsCount: number;
  deletedVerifsCount: number;
  deletedCountersCount: number;
  deletedPlansCount: number;
  errors: string[];
}> {
  const normEmail = preservedSuperAdminEmail.trim().toLowerCase();
  const errors: string[] = [];

  let deletedUsersCount = 0;
  let deletedSubsCount = 0;
  let deletedPaymentsCount = 0;
  let deletedVerifsCount = 0;
  let deletedCountersCount = 0;
  let deletedPlansCount = 0;

  // 1. Delete all users except super admin
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const uDoc of usersSnap.docs) {
      const data = uDoc.data();
      const userEmail = (data.email || '').trim().toLowerCase();
      if (userEmail === normEmail) {
        // Keep and sanitize super admin to pristine admin role
        await setDoc(
          doc(db, 'users', uDoc.id),
          {
            ...data,
            role: 'admin',
            designatedId: data.designatedId || 'ADM-000001',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } else {
        await deleteDoc(uDoc.ref);
        deletedUsersCount++;
      }
    }
  } catch (err: any) {
    console.error('Error clearing users during factory reset:', err);
    errors.push(`Users reset error: ${err?.message || err}`);
  }

  // 2. Clear all subscriptions
  try {
    const subsSnap = await getDocs(collection(db, 'subscriptions'));
    for (const s of subsSnap.docs) {
      await deleteDoc(s.ref);
      deletedSubsCount++;
    }
  } catch (err: any) {
    console.error('Error clearing subscriptions during factory reset:', err);
    errors.push(`Subscriptions reset error: ${err?.message || err}`);
  }

  // 3. Clear all payments
  try {
    const paymentsSnap = await getDocs(collection(db, 'payments'));
    for (const p of paymentsSnap.docs) {
      await deleteDoc(p.ref);
      deletedPaymentsCount++;
    }
  } catch (err: any) {
    console.error('Error clearing payments during factory reset:', err);
    errors.push(`Payments reset error: ${err?.message || err}`);
  }

  // 4. Clear all verifications
  try {
    const verifSnap = await getDocs(collection(db, 'verifications'));
    for (const v of verifSnap.docs) {
      await deleteDoc(v.ref);
      deletedVerifsCount++;
    }
  } catch (err: any) {
    console.error('Error clearing verifications during factory reset:', err);
    errors.push(`Verifications reset error: ${err?.message || err}`);
  }

  // 5. Reset all sequential ID counters
  try {
    const countersSnap = await getDocs(collection(db, 'counters'));
    for (const c of countersSnap.docs) {
      await deleteDoc(c.ref);
      deletedCountersCount++;
    }
    const now = new Date().toISOString();
    await setDoc(doc(db, 'counters', 'passengers'), { count: 0, updatedAt: now });
    await setDoc(doc(db, 'counters', 'cashiers'), { count: 0, updatedAt: now });
    await setDoc(doc(db, 'counters', 'checkers'), { count: 0, updatedAt: now });
    await setDoc(doc(db, 'counters', 'admins'), { count: 1, updatedAt: now });
  } catch (err: any) {
    console.error('Error resetting counters during factory reset:', err);
    errors.push(`Counters reset error: ${err?.message || err}`);
  }

  // 6. Reset plans to default factory list
  try {
    const plansSnap = await getDocs(collection(db, 'subscriptionPlans'));
    for (const p of plansSnap.docs) {
      await deleteDoc(p.ref);
      deletedPlansCount++;
    }
    const samplePlans = [
      {
        name: 'Day Pass Unlimited',
        description: 'Unlimited bus rides across all city express routes for 24 hours.',
        price: 60,
        durationDays: 1,
        isActive: true,
      },
      {
        name: 'Weekly Commuter Pass',
        description: '7-day unli-ride pass ideal for weekday office commuters.',
        price: 350,
        durationDays: 7,
        isActive: true,
      },
      {
        name: 'Monthly Express Pass',
        description: '30-day comprehensive pass with priority boarding on all city lines.',
        price: 1350,
        durationDays: 30,
        isActive: true,
      },
      {
        name: 'Quarterly Transit Pass',
        description: '90-day discounted seasonal pass for frequent bus riders.',
        price: 3600,
        durationDays: 90,
        isActive: true,
      },
      {
        name: 'Annual VIP Pass',
        description: '365-day all-access bus pass with maximum savings and free replacement ID.',
        price: 12000,
        durationDays: 365,
        isActive: true,
      },
    ];
    for (const p of samplePlans) {
      await createSubscriptionPlan(p);
    }
  } catch (err: any) {
    console.error('Error recreating default plans:', err);
    errors.push(`Plans recreation error: ${err?.message || err}`);
  }

  // 7. Reset company and GCash payment settings
  try {
    await updateCompanySettings(DEFAULT_COMPANY_SETTINGS);
    await updateGCashSettings(DEFAULT_GCASH_SETTINGS);
  } catch (err: any) {
    console.error('Error resetting settings:', err);
    errors.push(`Settings reset error: ${err?.message || err}`);
  }

  return {
    deletedUsersCount,
    deletedSubsCount,
    deletedPaymentsCount,
    deletedVerifsCount,
    deletedCountersCount,
    deletedPlansCount,
    errors,
  };
}

