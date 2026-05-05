/**
 * Centralized Automation Engine for MemberSync SaaS.
 * 
 * Attempts to use the Firebase Cloud Function for true shared logic.
 * Falls back to local client execution if the function is not deployed (for local dev).
 */

import { collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import { evaluateMemberStatus, MEMBERSHIP_STATUS } from '../rules/membershipRules';
import { getMemberAttendance } from './attendanceService';
import { getMemberViolations } from './violationService';
import { sendNotification } from './notificationService';
import { logAction } from './auditService';
import { NOTIFICATION_TYPES } from '../rules/notificationRules';

/**
 * Runs automation for a single organization.
 * Tries Backend Function first, falls back to Client logic.
 */
export const runAutomationCycle = async (orgId) => {
  if (!orgId) throw new Error("OrgId is required");
  console.log(`[Automation] Starting cycle for org: ${orgId}`);

  try {
    // 1. Attempt to use the Shared Backend Logic (Cloud Function)
    const triggerAutomation = httpsCallable(functions, 'triggerAutomation');
    const result = await triggerAutomation({ organizationId: orgId });
    return result.data;
  } catch (error) {
    console.warn("Cloud function 'triggerAutomation' not available or failed. Falling back to local client execution to ensure 'npm run dev' works uninterrupted.", error);
    
    // 2. Fallback: Client-side execution (Identical Logic)
    return await executeLocalAutomation(orgId);
  }
};

const executeLocalAutomation = async (orgId) => {
  const membersRef = collection(db, 'members');
  const q = query(membersRef, where("organizationId", "==", orgId));
  
  const snapshot = await getDocs(q);
  const results = {
    processed: 0,
    updated: 0,
    logs: []
  };

  for (const memberDoc of snapshot.docs) {
    const member = { id: memberDoc.id, ...memberDoc.data() };
    results.processed++;
    
    // Skip if banned (final state)
    if (member.status === MEMBERSHIP_STATUS.BANNED) continue;

    const currentOrgId = member.organizationId;
    
    // 2. Fetch context data for rules
    const [attendance, violations] = await Promise.all([
      getMemberAttendance(currentOrgId, member.memberId),
      getMemberViolations(currentOrgId, member.memberId)
    ]);

    // 3. Evaluate Business Rules
    const newStatus = evaluateMemberStatus(member, attendance, violations);

    // 4. Handle State Transitions
    if (newStatus !== member.status) {
      await updateDoc(doc(db, 'members', member.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      const logMsg = `Automated status transition: ${member.status} -> ${newStatus}`;
      
      // Audit Logging
      await logAction(currentOrgId, { id: 'system', fullName: 'Automation Engine' }, 'STATUS_SYNC', 'member', member.id, logMsg);

      // Notification Triggers
      if (newStatus === MEMBERSHIP_STATUS.EXPIRED) {
        await sendNotification(currentOrgId, member.uid || member.id, NOTIFICATION_TYPES.MEMBERSHIP_EXPIRED, { name: member.fullName });
      } else if (newStatus === MEMBERSHIP_STATUS.SUSPENDED) {
        await sendNotification(currentOrgId, member.uid || member.id, NOTIFICATION_TYPES.MEMBERSHIP_SUSPENDED, { 
          name: member.fullName, 
          reason: 'System detected policy violations or attendance risk' 
        });
      }

      results.updated++;
      results.logs.push(`${member.fullName}: ${member.status} -> ${newStatus}`);
    }
  }

  return results;
};
