/**
 * Date and Time utility functions for bus pass subscriptions
 * Configured specifically for Philippine Standard Time (PST / PHT, Asia/Manila, UTC+8)
 */

export const PHILIPPINE_TIMEZONE = 'Asia/Manila';

/**
 * Formats a date string/timestamp into Philippine Standard Date (e.g., "Aug 30, 2026")
 */
export function formatDate(dateStringOrTimestamp: string | number | Date | null | undefined): string {
  if (!dateStringOrTimestamp) return 'N/A';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-PH', {
      timeZone: PHILIPPINE_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Formats a date string/timestamp into Philippine Standard Date & Time (e.g., "Aug 30, 2026, 09:15 AM")
 */
export function formatDateTime(dateStringOrTimestamp: string | number | Date | null | undefined): string {
  if (!dateStringOrTimestamp) return 'N/A';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-PH', {
      timeZone: PHILIPPINE_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Formats time only in Philippine Standard Time (e.g., "09:15 AM")
 */
export function formatTime(dateStringOrTimestamp: string | number | Date | null | undefined): string {
  if (!dateStringOrTimestamp) return 'N/A';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString('en-PH', {
      timeZone: PHILIPPINE_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Formats full Philippine Date & Time with explicit timezone indicator (e.g., "Aug 30, 2026, 09:15 AM (PHT)")
 */
export function formatPhilippineDateTimeWithZone(dateStringOrTimestamp: string | number | Date | null | undefined): string {
  if (!dateStringOrTimestamp) return 'N/A';
  const formatted = formatDateTime(dateStringOrTimestamp);
  if (formatted === 'N/A') return 'N/A';
  return `${formatted} (PHT, UTC+8)`;
}

/**
 * Returns formatted live Philippine current date & time string for header banners
 */
export function getPhilippineCurrentDateTimeString(): string {
  return new Date().toLocaleString('en-PH', {
    timeZone: PHILIPPINE_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Calculates expiry date based on a given start date and duration in days
 */
export function calculateExpiryDate(startDateIso: string, durationDays: number): string {
  const start = new Date(startDateIso);
  const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
  return expiry.toISOString();
}

/**
 * Calculates start and expiry dates for a new pass with automatic CONTINUATION / ROLLING EXTENSION.
 * If the passenger already has an active or future-queued pass, the new pass begins exactly on the
 * previous pass's expiryDate so no remaining days are lost.
 */
export function calculateContinuationDates(
  existingActiveExpiryDate: string | null | undefined,
  durationDays: number,
  customStartDate?: string
): { startDate: string; expiryDate: string; isContinuation: boolean; previousExpiry?: string } {
  const now = Date.now();
  if (existingActiveExpiryDate) {
    const prevExpiryTime = new Date(existingActiveExpiryDate).getTime();
    // If the active card expires in the future, seamlessly stack the new card from that expiry date!
    if (!isNaN(prevExpiryTime) && prevExpiryTime > now) {
      const startDate = existingActiveExpiryDate;
      const expiryDate = calculateExpiryDate(existingActiveExpiryDate, durationDays);
      return {
        startDate,
        expiryDate,
        isContinuation: true,
        previousExpiry: existingActiveExpiryDate,
      };
    }
  }

  // Otherwise, starts today / custom start date
  const startDate = customStartDate || new Date().toISOString();
  const expiryDate = calculateExpiryDate(startDate, durationDays);
  return {
    startDate,
    expiryDate,
    isContinuation: false,
  };
}

/**
 * Checks if a subscription is currently valid right now
 */
export function isSubscriptionActive(subscription: {
  status: string;
  startDate?: string;
  expiryDate?: string;
}): boolean {
  if (subscription.status !== 'active') return false;
  if (!subscription.startDate || !subscription.expiryDate) return false;

  const now = Date.now();
  const start = new Date(subscription.startDate).getTime();
  const expiry = new Date(subscription.expiryDate).getTime();

  return now >= start && now <= expiry;
}

/**
 * Checks if a subscription is an upcoming / queued renewal continuation pass (starts in the future)
 */
export function isSubscriptionQueued(subscription: {
  status: string;
  startDate?: string;
  expiryDate?: string;
}): boolean {
  if (subscription.status !== 'active') return false;
  if (!subscription.startDate || !subscription.expiryDate) return false;

  const now = Date.now();
  const start = new Date(subscription.startDate).getTime();
  const expiry = new Date(subscription.expiryDate).getTime();

  return start > now && expiry > now;
}

/**
 * Checks if a subscription is active now or queued for future continuation
 */
export function isSubscriptionValidOrQueued(subscription: {
  status: string;
  startDate?: string;
  expiryDate?: string;
}): boolean {
  if (subscription.status !== 'active') return false;
  if (!subscription.expiryDate) return false;

  const now = Date.now();
  const expiry = new Date(subscription.expiryDate).getTime();

  return expiry > now;
}

/**
 * Returns remaining days from now until the expiry date
 */
export function getRemainingDays(expiryDateIso: string): number {
  try {
    const now = Date.now();
    const expiry = new Date(expiryDateIso).getTime();
    const diffMs = expiry - now;
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Formats Philippine Peso currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
