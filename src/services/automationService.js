/**
 * Automation Service
 * Handles automated system checks for membership, attendance, and violations.
 * This simulates the logic that would run in a Firebase Cloud Function.
 */

import { collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { evaluateMemberStatus, MEMBERSHIP_STATUS } from '../rules/membershipRules';
import { getMemberAttendance } from './attendanceService';
import { getMemberViolations } from './violationService';
import { sendNotification } from './notificationService';

export const runDailyAutomation = async () => {
  console.log("Starting daily automation check...");
  const membersRef = collection(db, 'members');
  const snapshot = await getDocs(membersRef);
  
  let changes = 0;
  const logs = [];

  for (const memberDoc of snapshot.docs) {
    const member = { id: memberDoc.id, ...memberDoc.data() };
    
    // Skip banned members
    if (member.status === MEMBERSHIP_STATUS.BANNED) continue;

    // Fetch dependencies for evaluation
    const [attendance, violations] = await Promise.all([
      getMemberAttendance(member.memberId),
      getMemberViolations(member.memberId)
    ]);

    // 1. Evaluate Status Transitions
    const newStatus = evaluateMemberStatus(member, attendance, violations);

    if (newStatus !== member.status) {
      await updateDoc(doc(db, 'members', member.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Log the change
      const logMsg = `Automated status transition: ${member.status} -> ${newStatus}`;
      await addDoc(collection(db, 'auditLogs'), {
        actorId: 'system-automation',
        actorName: 'Automation Engine',
        action: 'STATUS_UPDATE',
        targetType: 'member',
        targetId: member.id,
        description: logMsg,
        createdAt: serverTimestamp()
      });

      // Notify member
      if (newStatus === MEMBERSHIP_STATUS.EXPIRED) {
        await sendNotification(member.id, 'MEMBERSHIP_EXPIRED', { name: member.fullName });
      } else if (newStatus === MEMBERSHIP_STATUS.SUSPENDED) {
        await sendNotification(member.id, 'MEMBERSHIP_SUSPENDED', { name: member.fullName, reason: 'System detected violations or attendance issues' });
      }

      changes++;
      logs.push(`${member.fullName}: ${member.status} -> ${newStatus}`);
    }
  }

  console.log(`Automation complete. ${changes} members updated.`);
  return { changes, logs };
};
