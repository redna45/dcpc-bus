export type UserRole = 'passenger' | 'cashier' | 'checker' | 'admin';

export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'rejected' | 'cancelled';

export type PaymentStatus = 'pending_review' | 'approved' | 'rejected';

export type PaymentMethod = 'GCash' | 'Cash' | 'Manual';

export type VerificationResultType = 'valid' | 'expired' | 'no_active_subscription' | 'passenger_not_found';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  photoUrl: string;
  role: UserRole;
  passengerNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Subscription {
  id: string;
  passengerId: string;
  passengerNumber: string;
  passengerName: string;
  planId: string;
  planNameSnapshot: string;
  price: number;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  status: SubscriptionStatus;
  startDate: string; // ISO String
  expiryDate: string; // ISO String
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  createdBy?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  passengerId: string;
  passengerNumber: string;
  passengerName: string;
  planId: string;
  planName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  screenshotUrl: string;
  status: PaymentStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface VerificationLog {
  id: string;
  passengerId: string;
  passengerNumber: string;
  passengerName: string;
  checkerId: string;
  checkerName: string;
  result: VerificationResultType;
  timestamp: string;
  planName?: string;
  expiryDate?: string;
}

export interface CompanySettings {
  companyName: string;
  logoUrl?: string;
  contactNumber: string;
  address: string;
  email?: string;
  website?: string;
  tagline?: string;
}

export interface GCashSettings {
  gcashAccountName: string;
  gcashMobileNumber: string;
  paymentInstructions: string;
  qrImageUrl?: string;
}

export interface VerificationResultData {
  result: VerificationResultType;
  passenger?: UserProfile;
  subscription?: Subscription;
  message?: string;
}
