import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', size = 'md' }) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  if (normalized === 'active' || normalized === 'approved' || normalized === 'valid') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = normalized === 'valid' ? 'VALID' : normalized === 'approved' ? 'Approved' : 'Active';
  } else if (normalized === 'expired') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Expired';
  } else if (normalized === 'pending' || normalized === 'pending_review') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    label = normalized === 'pending_review' ? 'Pending Review' : 'Pending';
  } else if (normalized === 'rejected' || normalized === 'cancelled') {
    colorClasses = 'bg-red-50 text-red-700 border-red-200';
    label = normalized === 'rejected' ? 'Rejected' : 'Cancelled';
  } else if (normalized === 'no_active_subscription') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'No Active Plan';
  } else if (normalized === 'passenger_not_found') {
    colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
    label = 'Not Found';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-bold px-3.5 py-1.5',
  }[size];

  return (
    <span
      id={`badge-${normalized}`}
      className={`inline-flex items-center justify-center font-medium rounded-full border whitespace-nowrap tracking-wide ${sizeClasses} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};
