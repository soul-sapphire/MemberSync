import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { safeTimestampToDate } from '../utils/formatters';

/**
 * FETCH ALL MEMBERS FOR REPORTING
 * Strictly scoped by organizationId
 */
export const fetchAllMembers = async (orgId) => {
  if (!orgId) throw new Error("Organization ID is required for reporting.");
  try {
    const q = query(collection(db, 'members'), where('organizationId', '==', orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching members for reports:", error);
    return [];
  }
};

/**
 * FETCH ALL PAYMENTS FOR REPORTING
 * Strictly scoped by organizationId
 */
export const fetchAllPayments = async (orgId) => {
  if (!orgId) throw new Error("Organization ID is required for reporting.");
  try {
    const q = query(collection(db, 'payments'), where('organizationId', '==', orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching payments for reports:", error);
    return [];
  }
};

/**
 * DATA NORMALIZATION UTILITIES
 */
export const normalizeStatus = (status) => {
  if (!status) return 'Unknown';
  const s = status.toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'pending') return 'Pending';
  if (s === 'suspended') return 'Suspended';
  if (s === 'expired') return 'Expired';
  if (s === 'rejected') return 'Rejected';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export const isExpired = (expiryDateValue) => {
  if (!expiryDateValue) return false;
  try {
    const date = safeTimestampToDate(expiryDateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  } catch (error) {
    return false;
  }
};
