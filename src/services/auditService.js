import { collection, addDoc, getDocs, query, limit, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { safeTimestampToDate } from '../utils/formatters';

const AUDIT_COLLECTION = 'auditLogs';

/**
 * Logs a system or user action with organization scoping.
 */
export const logAction = async (orgId, actor, action, targetType, targetId, reason = '') => {
  if (!orgId) throw new Error("Organization ID is required for logging");
  try {
    await addDoc(collection(db, AUDIT_COLLECTION), {
      organizationId: orgId,
      actorId: actor?.uid || actor?.id || 'system',
      actorName: actor?.displayName || actor?.fullName || 'System',
      action,
      targetType,
      targetId,
      reason,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging audit action:", error);
  }
};

/**
 * Fetches audit logs for a specific organization.
 */
export const getAuditLogs = async (orgId, targetId = null, filters = {}) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    let constraints = [where("organizationId", "==", orgId)];
    
    if (targetId) {
      constraints.push(where('targetId', '==', targetId));
    }
    
    const q = query(collection(db, AUDIT_COLLECTION), ...constraints, limit(100));
    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // In-memory sorting to avoid composite index requirement (where + orderBy)
    logs.sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));

    if (filters.action && filters.action !== 'All') {
      logs = logs.filter(l => l.action === filters.action);
    }

    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      throw error; // Re-throw for UI handling
    }
    return [];
  }
};
