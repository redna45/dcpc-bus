/**
 * Date utility functions for bus pass subscriptions
 */

export function formatDate(dateStringOrTimestamp: string | number | Date | null | undefined): string {
  if (!dateStringOrTimestamp) return 'N/A';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

export function formatDateTime(dateStringOrTimestamp: string | number | Date | null | undefined): string {
  if (!dateStringOrTimestamp) return 'N/A';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

export function calculateExpiryDate(startDateIso: string, durationDays: number): string {
  const start = new Date(startDateIso);
  const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
  return expiry.toISOString();
}

export function isSubscriptionActive(subscription: {
  status: string;
  startDate?: string;
  expiryDate?: string;
}): boolean {
  if (subscription.status !== 'active') return false;
  if (!subscription.startDate || !subscription.expiryDate) return false;

  const now = new Date().getTime();
  const start = new Date(subscription.startDate).getTime();
  const expiry = new Date(subscription.expiryDate).getTime();

  return now >= start && now <= expiry;
}

export function getRemainingDays(expiryDateIso: string): number {
  try {
    const now = new Date().getTime();
    const expiry = new Date(expiryDateIso).getTime();
    const diffMs = expiry - now;
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
