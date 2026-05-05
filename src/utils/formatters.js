import { format } from 'date-fns';

/**
 * Safely converts any date-like value (Timestamp, String, Date) to a Date object.
 */
export const safeTimestampToDate = (value) => {
  if (!value) return new Date();
  
  // Handle Firestore Timestamp
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Handle String or Number
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Safely formats a date-like value.
 */
export const safeFormatDate = (value, formatStr = 'PPP') => {
  try {
    const date = safeTimestampToDate(value);
    return format(date, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Normalizes a value into an array. Handles strings (comma-separated) and arrays.
 */
export const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Formats a number as currency.
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

/**
 * Returns a color class for a member status.
 */
export const getStatusColor = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'expired': return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'suspended': return 'text-slate-600 bg-slate-50 border-slate-100';
    case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
    default: return 'text-brand-600 bg-brand-50 border-brand-100';
  }
};

/**
 * Returns a color class for a payment status.
 */
export const getPaymentStatusColor = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'paid': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'failed': return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'refunded': return 'text-slate-600 bg-slate-50 border-slate-100';
    default: return 'text-brand-600 bg-brand-50 border-brand-100';
  }
};
