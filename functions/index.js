const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Shared Membership Rules Engine
 */
async function runMembershipRulesEngine({
  organizationId = "default",
  triggeredBy = "system",
  dryRun = false
}) {
  const startedAt = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = {
    organizationId,
    triggeredBy,
    dryRun,
    checked: 0,
    updated: 0,
    notificationsCreated: 0,
    auditLogsCreated: 0,
    reviewTasksCreated: 0,
    gracePeriodCount: 0,
    expiredCount: 0,
    suspendedCount: 0,
    watchlistCount: 0,
    atRiskCount: 0,
    paymentOverdueCount: 0,
    startedAt: admin.firestore.Timestamp.fromDate(startedAt),
    summaryText: ""
  };

  try {
    const membersSnap = await db.collection("members")
      .where("organizationId", "==", organizationId)
      .get();

    if (membersSnap.empty) {
      results.summaryText = "No members found to process.";
      results.completedAt = admin.firestore.Timestamp.now();
      return results;
    }

    results.checked = membersSnap.size;
    const batch = db.batch();
    const todayStr = today.toISOString().split('T')[0];

    for (const memberDoc of membersSnap.docs) {
      const member = memberDoc.data();
      const memberRef = memberDoc.ref;
      const updates = {};
      const rulesTriggered = [];
      
      const expiryDate = member.expiryDate ? new Date(member.expiryDate) : null;
      const joinDate = member.joinDate ? new Date(member.joinDate) : null;
      
      // Calculate days diff
      const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
      const daysSinceExpiry = expiryDate ? Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24)) : null;
      const daysSinceJoined = joinDate ? Math.floor((today - joinDate) / (1000 * 60 * 60 * 24)) : null;

      // RULE A: Expiry Reminders
      if (member.status === "Active" && daysUntilExpiry !== null) {
        if (daysUntilExpiry === 7) {
          const key = `${member.memberId}-expiry-reminder-7-${todayStr}`;
          await createNotification(organizationId, memberDoc.id, member, {
            title: "Membership Renewal Reminder",
            message: "Your membership will expire in 7 days. Please renew to avoid interruption.",
            type: "reminder",
            priority: "medium",
            maintenanceKey: key
          }, results, dryRun);
          rulesTriggered.push("expiry_reminder_7d");
        } else if (daysUntilExpiry === 3) {
          const key = `${member.memberId}-expiry-reminder-3-${todayStr}`;
          await createNotification(organizationId, memberDoc.id, member, {
            title: "Urgent Renewal Reminder",
            message: "Your membership will expire in 3 days. Please renew soon.",
            type: "warning",
            priority: "high",
            maintenanceKey: key
          }, results, dryRun);
          rulesTriggered.push("expiry_reminder_3d");
        }
      }

      // RULE B & C: Expiry Status Escalation
      if (expiryDate && daysSinceExpiry > 0) {
        if (daysSinceExpiry <= 7) {
          if (member.status !== "grace_period") {
            updates.status = "grace_period";
            updates.maintenanceReason = "grace_period";
            rulesTriggered.push("grace_period_entry");
            results.gracePeriodCount++;
            
            await createNotification(organizationId, memberDoc.id, member, {
              title: "Membership in Grace Period",
              message: "Your membership has expired, but you are currently in a grace period. Please renew soon.",
              type: "warning",
              priority: "high",
              maintenanceKey: `${member.memberId}-grace-period-${todayStr}`
            }, results, dryRun);
          }
        } else {
          if (member.status !== "Expired") {
            updates.status = "Expired";
            updates.maintenanceReason = "expired";
            rulesTriggered.push("expired_entry");
            results.expiredCount++;

            await createNotification(organizationId, memberDoc.id, member, {
              title: "Membership Expired",
              message: "Your membership has expired. Please renew your plan to continue using member benefits.",
              type: "alert",
              priority: "high",
              maintenanceKey: `${member.memberId}-expired-${todayStr}`
            }, results, dryRun);
          }
        }
      }

      // RULE D: Attendance Risk
      if (daysSinceJoined > 30) {
        const count = member.attendanceCount || 0;
        let newStanding = member.standing || "good";
        let newRisk = member.attendanceRisk || "low";

        if (count >= 8) {
          newStanding = "good";
          newRisk = "low";
        } else if (count >= 4) {
          if (newStanding !== "watchlist") {
            newStanding = "watchlist";
            newRisk = "medium";
            results.watchlistCount++;
            await createNotification(organizationId, memberDoc.id, member, {
              title: "Attendance Watchlist",
              message: "Your attendance is below the expected level. Please attend upcoming meetings.",
              type: "info",
              priority: "low",
              maintenanceKey: `${member.memberId}-attendance-watchlist-${todayStr}`
            }, results, dryRun);
            rulesTriggered.push("attendance_watchlist");
          }
        } else if (count >= 1) {
          if (newStanding !== "at_risk") {
            newStanding = "at_risk";
            newRisk = "high";
            results.atRiskCount++;
            await createNotification(organizationId, memberDoc.id, member, {
              title: "Attendance At Risk",
              message: "Your attendance is very low. Please improve attendance to avoid suspension.",
              type: "warning",
              priority: "high",
              maintenanceKey: `${member.memberId}-attendance-risk-${todayStr}`
            }, results, dryRun);
            rulesTriggered.push("attendance_at_risk");
          }
        } else {
          // count == 0
          if (newStanding !== "critical") {
            newStanding = "critical";
            newRisk = "critical";
            rulesTriggered.push("attendance_critical");
            
            await createReviewTask(organizationId, memberDoc.id, member, {
              reason: "low_attendance",
              priority: "high",
              description: "Member has zero attendance in the first 30+ days.",
              maintenanceKey: `${member.memberId}-low-attendance`
            }, results, dryRun);

            // Suspension logic: If already at_risk, suspend
            if (member.standing === "at_risk" && member.status === "Active") {
              updates.status = "Suspended";
              updates.maintenanceReason = "attendance_critical_suspension";
              results.suspendedCount++;
            }
          }
        }

        if (newStanding !== member.standing) updates.standing = newStanding;
        if (newRisk !== member.attendanceRisk) updates.attendanceRisk = newRisk;
      }

      // RULE E: Offense Escalation
      const offenses = member.offenseCount || 0;
      if (offenses > 0) {
        if (offenses === 1 && member.warningLevel !== "first_warning") {
          updates.warningLevel = "first_warning";
          rulesTriggered.push("offense_warning_1");
          await createNotification(organizationId, memberDoc.id, member, {
            title: "Rule Violation Warning",
            message: "A rule violation has been recorded. Please follow membership guidelines.",
            type: "warning",
            priority: "medium",
            maintenanceKey: `${member.memberId}-offense-1`
          }, results, dryRun);
        } else if (offenses === 2 && member.warningLevel !== "final_warning") {
          updates.warningLevel = "final_warning";
          rulesTriggered.push("offense_warning_2");
          await createNotification(organizationId, memberDoc.id, member, {
            title: "Final Warning",
            message: "Repeated rule violations may result in suspension.",
            type: "warning",
            priority: "high",
            maintenanceKey: `${member.memberId}-offense-2`
          }, results, dryRun);
        } else if (offenses >= 3 && member.status !== "Suspended") {
          updates.status = "Suspended";
          updates.warningLevel = "suspended";
          updates.maintenanceReason = "offense_limit";
          rulesTriggered.push("offense_suspension");
          results.suspendedCount++;
          await createNotification(organizationId, memberDoc.id, member, {
            title: "Membership Suspended",
            message: "Your membership has been suspended due to repeated rule violations.",
            type: "alert",
            priority: "critical",
            maintenanceKey: `${member.memberId}-offense-suspension`
          }, results, dryRun);
          await createReviewTask(organizationId, memberDoc.id, member, {
            reason: "offense_limit",
            priority: "critical",
            description: `Member suspended due to ${offenses} offenses.`,
            maintenanceKey: `${member.memberId}-offense-limit`
          }, results, dryRun);
        }

        if (offenses >= 5 && member.reviewStatus !== "termination_review") {
          updates.reviewStatus = "termination_review";
          rulesTriggered.push("termination_review_triggered");
          await createReviewTask(organizationId, memberDoc.id, member, {
            reason: "termination_review",
            priority: "critical",
            description: "Member reached 5+ offenses. Manual termination review required.",
            maintenanceKey: `${member.memberId}-termination-review`
          }, results, dryRun);
        }
      }

      // RULE F: Payment Overdue Escalation
      if (member.paymentStatus === "Unpaid" || member.paymentStatus === "overdue") {
        if (daysSinceExpiry > 0) {
          if (member.paymentStatus !== "overdue") {
            updates.paymentStatus = "overdue";
            results.paymentOverdueCount++;
            rulesTriggered.push("payment_overdue_initial");
          }

          if (daysSinceExpiry > 14) {
            rulesTriggered.push("payment_overdue_14d");
            await createReviewTask(organizationId, memberDoc.id, member, {
              reason: "payment_overdue_14_days",
              priority: "medium",
              description: "Payment is overdue for more than 14 days.",
              maintenanceKey: `${member.memberId}-payment-14d`
            }, results, dryRun);
          }

          if (daysSinceExpiry > 30 && member.status !== "Suspended") {
            updates.status = "Suspended";
            updates.maintenanceReason = "payment_overdue_30_days";
            rulesTriggered.push("payment_overdue_30d_suspension");
            results.suspendedCount++;
            await createNotification(organizationId, memberDoc.id, member, {
              title: "Membership Suspended for Overdue Payment",
              message: "Your membership has been suspended due to long overdue payment.",
              type: "alert",
              priority: "critical",
              maintenanceKey: `${member.memberId}-payment-30d-suspension`
            }, results, dryRun);
          }
        }
      }

      // PERSIST UPDATES
      if (Object.keys(updates).length > 0) {
        results.updated++;
        const finalUpdates = {
          ...updates,
          lastMaintenanceAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastRuleEvaluation: {
            triggeredBy,
            evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
            rulesTriggered
          }
        };

        if (!dryRun) {
          batch.update(memberRef, finalUpdates);
          
          // Create Audit Log
          const logRef = db.collection("auditLogs").doc();
          batch.set(logRef, {
            organizationId,
            isDemo: !!member.isDemo,
            action: "RULES_ENGINE_UPDATE",
            description: `Automated maintenance update: ${rulesTriggered.join(", ")}`,
            actorName: triggeredBy,
            targetType: "member",
            targetId: memberDoc.id,
            metadata: {
              beforeStatus: member.status,
              afterStatus: updates.status || member.status,
              rulesTriggered
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          results.auditLogsCreated++;
        }
      }
    }

    if (!dryRun) {
      await batch.commit();
    }

    results.completedAt = admin.firestore.Timestamp.now();
    results.summaryText = `Maintenance complete. Checked ${results.checked} members. Updated ${results.updated}. Notifications: ${results.notificationsCreated}. Review Tasks: ${results.reviewTasksCreated}.`;

    // Save Run Summary
    if (!dryRun) {
      await db.collection("maintenanceRuns").add({
        ...results,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return results;

  } catch (error) {
    logger.error("Rules Engine Error:", error);
    throw new Error(error.message);
  }
}

/**
 * Helper to create notifications with deduplication
 */
async function createNotification(orgId, userId, member, data, results, dryRun) {
  if (dryRun) {
    results.notificationsCreated++;
    return;
  }

  const { maintenanceKey } = data;
  const notifRef = db.collection("notifications").doc(maintenanceKey);
  
  // Use set with merge to avoid duplicates if key is document ID
  // Or check existence. Document ID as maintenanceKey is safer for atomicity.
  const snap = await notifRef.get();
  if (!snap.exists) {
    await notifRef.set({
      organizationId: orgId,
      userId,
      memberId: member.memberId,
      memberName: member.fullName,
      ...data,
      read: false,
      isDemo: !!member.isDemo,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    results.notificationsCreated++;
  }
}

/**
 * Helper to create admin review tasks with deduplication
 */
async function createReviewTask(orgId, memberDocId, member, data, results, dryRun) {
  if (dryRun) {
    results.reviewTasksCreated++;
    return;
  }

  const taskId = `${memberDocId}-${data.reason}`;
  const taskRef = db.collection("adminReviewTasks").doc(taskId);
  
  const snap = await taskRef.get();
  if (!snap.exists) {
    await taskRef.set({
      organizationId: orgId,
      memberId: memberDocId,
      memberUID: member.memberId,
      memberName: member.fullName,
      status: "open",
      source: "rules_engine",
      ...data,
      isDemo: !!member.isDemo,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    results.reviewTasksCreated++;
  }
}

/**
 * Manual Trigger for Rules Engine
 */
exports.runMembershipRulesEngineNow = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    // Basic auth check
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");
    
    const organizationId = request.data?.organizationId || "default";
    const dryRun = request.data?.dryRun || false;

    return await runMembershipRulesEngine({
      organizationId,
      triggeredBy: request.auth.token.email || "manual-admin",
      dryRun
    });
  }
);

/**
 * Scheduled Daily Rules Engine
 */
exports.dailyMembershipRulesEngine = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "Asia/Colombo",
    region: "us-central1"
  },
  async (event) => {
    // Note: Usually run for 'default' or iterate all organizations
    return await runMembershipRulesEngine({
      organizationId: "default",
      triggeredBy: "system-24h",
      dryRun: false
    });
  }
);

/**
 * Updated populateDatabase with edge cases for testing Rules Engine
 */
exports.populateDatabase = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const organizationId = request.data?.organizationId || "default";
    
    try {
      logger.info(`Starting database population for org: ${organizationId}`);

      // 1. Cleanup
      const collections = ["members", "payments", "notifications", "membershipPlans", "auditLogs", "maintenanceRuns", "adminReviewTasks"];
      for (const collName of collections) {
        const snapshot = await db.collection(collName)
          .where("organizationId", "==", organizationId)
          .where("isDemo", "==", true)
          .get();

        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      const batches = [];
      let currentBatch = db.batch();
      let opCount = 0;

      const addOperation = (ref, data) => {
        currentBatch.set(ref, {
          ...data,
          organizationId,
          isDemo: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          opCount = 0;
        }
      };

      // 2. Plans
      const plans = [
        { name: "Basic", price: 29, features: ["Gym"] },
        { name: "Standard", price: 59, features: ["Gym", "Pool"] },
        { name: "Premium", price: 99, features: ["All Access"] }
      ];
      const planRefs = {};
      plans.forEach(p => {
        const ref = db.collection("membershipPlans").doc();
        planRefs[p.name] = { id: ref.id, ...p };
        addOperation(ref, p);
      });

      // 3. Seed Members (30 total)
      const members = [];
      const today = new Date();

      for (let i = 0; i < 30; i++) {
        let status = "Active";
        let attendanceCount = Math.floor(Math.random() * 20) + 10;
        let offenseCount = 0;
        let paymentStatus = "Paid";
        
        const joinDate = new Date(today);
        const expiryDate = new Date(today);

        // EDGE CASES
        if (i === 0) { // Expiring in 7 days
          expiryDate.setDate(today.getDate() + 7);
          joinDate.setFullYear(expiryDate.getFullYear() - 1);
        } else if (i === 1) { // Expiring in 3 days
          expiryDate.setDate(today.getDate() + 3);
          joinDate.setFullYear(expiryDate.getFullYear() - 1);
        } else if (i === 2) { // Expired 2 days ago (Grace Period Target)
          expiryDate.setDate(today.getDate() - 2);
          joinDate.setFullYear(expiryDate.getFullYear() - 1);
          paymentStatus = "Unpaid";
        } else if (i === 3) { // Expired 10 days ago (Expired Target)
          expiryDate.setDate(today.getDate() - 10);
          joinDate.setFullYear(expiryDate.getFullYear() - 1);
          paymentStatus = "Unpaid";
        } else if (i === 4) { // Low attendance risk (after 30 days)
          joinDate.setDate(today.getDate() - 40);
          expiryDate.setFullYear(joinDate.getFullYear() + 1);
          attendanceCount = 5; // Watchlist
        } else if (i === 5) { // Critical attendance
          joinDate.setDate(today.getDate() - 45);
          expiryDate.setFullYear(joinDate.getFullYear() + 1);
          attendanceCount = 0; // Critical
        } else if (i === 6) { // 1 Offense
          offenseCount = 1;
        } else if (i === 7) { // 2 Offenses
          offenseCount = 2;
        } else if (i === 8) { // 3 Offenses (Suspension target)
          offenseCount = 3;
        } else if (i === 9) { // 5 Offenses (Termination review)
          offenseCount = 5;
        } else if (i === 10) { // Overdue payment 15 days
          expiryDate.setDate(today.getDate() - 15);
          joinDate.setFullYear(expiryDate.getFullYear() - 1);
          paymentStatus = "Unpaid";
        } else if (i === 11) { // Overdue payment 35 days (Suspension)
          expiryDate.setDate(today.getDate() - 35);
          joinDate.setFullYear(expiryDate.getFullYear() - 1);
          paymentStatus = "Unpaid";
        } else {
          // Regular members
          joinDate.setDate(today.getDate() - (i * 5));
          expiryDate.setFullYear(joinDate.getFullYear() + 1);
          if (i > 25) status = "Pending";
        }

        const planName = i % 3 === 0 ? "Premium" : i % 2 === 0 ? "Standard" : "Basic";
        const plan = planRefs[planName];
        const memberRef = db.collection("members").doc();

        const memberData = {
          fullName: `Member ${i + 1}`,
          email: `member${i + 1}@example.com`,
          memberId: `MEM-${1000 + i}`,
          status,
          planName,
          planId: plan.id,
          joinDate: joinDate.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          attendanceCount,
          offenseCount,
          paymentStatus,
          totalPaid: paymentStatus === "Paid" ? plan.price * 5 : 0,
          role: "member"
        };

        members.push({ id: memberRef.id, ...memberData });
        addOperation(memberRef, memberData);
      }

      // Add 10 generic payments
      for (let i = 0; i < 10; i++) {
        const member = members[i % 10];
        const payRef = db.collection("payments").doc();
        addOperation(payRef, {
          memberId: member.memberId,
          fullName: member.fullName,
          amount: 50,
          status: "Paid",
          paymentDate: today.toISOString().split('T')[0]
        });
      }

      if (opCount > 0) batches.push(currentBatch);
      for (const b of batches) await b.commit();

      return { success: true, message: "Database populated with Rules Engine test cases" };
    } catch (error) {
      logger.error(error);
      throw new HttpsError("internal", error.message);
    }
  }
);
