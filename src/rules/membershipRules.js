import { differenceInDays, isAfter, addMonths } from 'date-fns';
import { safeTimestampToDate } from '../utils/formatters';

export const MEMBERSHIP_STATUS = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  SUSPENDED: 'Suspended',
  BANNED: 'Banned',
  INACTIVE: 'Inactive',
  PENDING_PAYMENT: 'Pending Payment',
  REJECTED: 'Rejected'
};

export const GRACE_DAYS = 7;
export const OFFENSE_THRESHOLD_SUSPENSION = 5;
export const OFFENSE_THRESHOLD_BAN = 8;

/**
 * Evaluates the status of a member based on various business rules.
 */
export const evaluateMemberStatus = (member, attendanceStats = [], violations = []) => {
  if (member.status === MEMBERSHIP_STATUS.BANNED) return MEMBERSHIP_STATUS.BANNED;
  if (member.status === MEMBERSHIP_STATUS.REJECTED) return MEMBERSHIP_STATUS.REJECTED;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryDate = safeTimestampToDate(member.expiryDate);
  const daysSinceExpiry = differenceInDays(today, expiryDate);

  // 1. Violation Rules
  const activeViolations = violations.filter(v => true);
  const offensePoints = member.offenseCount || activeViolations.reduce((sum, v) => sum + (v.points || 0), 0);
  const hasCriticalViolation = activeViolations.some(v => v.severity === 'Critical');

  if (offensePoints >= OFFENSE_THRESHOLD_BAN) return MEMBERSHIP_STATUS.BANNED;
  if (offensePoints >= OFFENSE_THRESHOLD_SUSPENSION || hasCriticalViolation) return MEMBERSHIP_STATUS.SUSPENDED;

  // 2. Expiry Rules
  if (isAfter(today, expiryDate)) {
    if (daysSinceExpiry <= GRACE_DAYS) {
      // Still in grace period
    } else {
      return MEMBERSHIP_STATUS.EXPIRED;
    }
  }

  // 3. Payment Rules
  if (member.paymentStatus !== 'Paid') {
    return MEMBERSHIP_STATUS.PENDING_PAYMENT;
  }

  // 4. Profile Rules
  if (member.completionPercentage && member.completionPercentage < 100) {
    // return MEMBERSHIP_STATUS.PENDING; // Optional: restrict if profile incomplete
  }

  return MEMBERSHIP_STATUS.ACTIVE;
};

export const isExpiringSoon = (expiryDateValue, thresholdDays = 7) => {
  if (!expiryDateValue) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = safeTimestampToDate(expiryDateValue);
    const daysUntil = differenceInDays(expiryDate, today);
    return daysUntil >= 0 && daysUntil <= thresholdDays;
  } catch (error) {
    return false;
  }
};

export const calculateRenewalDate = (currentExpiry, monthsToAdd) => {
  const date = safeTimestampToDate(currentExpiry);
  return addMonths(date, monthsToAdd).toISOString().split('T')[0];
};
