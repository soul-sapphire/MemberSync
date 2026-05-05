const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Rebuilds the demo database for a specific organization.
 * Seeds members, payments, notifications, plans, and audit logs.
 */
exports.populateDatabase = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const organizationId = request.data?.organizationId || "default";
    
    // TODO: Add production admin-only check here.
    // if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    try {
      logger.info(`Starting database population for org: ${organizationId}`);

      // 1. Cleanup existing demo data for this organization
      const collections = ["members", "payments", "notifications", "membershipPlans", "auditLogs"];
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

      // 2. Seed Membership Plans
      const plans = [
        { name: "Basic", price: 29, features: ["Access to Gym", "1 Guest Pass/mo"] },
        { name: "Standard", price: 59, features: ["Access to Gym", "Classes", "5 Guest Passes/mo"] },
        { name: "Premium", price: 99, features: ["All Access", "Pool", "Personal Trainer", "Unlimited Guest Passes"] }
      ];

      const planRefs = {};
      plans.forEach(p => {
        const ref = db.collection("membershipPlans").doc();
        planRefs[p.name] = { id: ref.id, ...p };
        addOperation(ref, p);
      });

      // 3. Seed Members
      const statuses = ["Active", "Pending", "Expired", "Suspended", "Rejected"];
      const members = [];
      
      // 25 members + 5 pending specifically
      const totalToSeed = 30;
      for (let i = 0; i < totalToSeed; i++) {
        let status = statuses[i % statuses.length];
        if (i >= 25) status = "Pending"; // Ensure at least 5 pending

        const planName = i % 3 === 0 ? "Premium" : i % 2 === 0 ? "Standard" : "Basic";
        const plan = planRefs[planName];

        const memberId = `MEM-${1000 + i}`;
        const memberRef = db.collection("members").doc();
        
        const joinDate = new Date();
        joinDate.setDate(joinDate.getDate() - (i * 10));
        
        const expiryDate = new Date(joinDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        const memberData = {
          fullName: `Demo Member ${i + 1}`,
          email: `member${i + 1}@example.com`,
          phone: `555-010${i}`,
          memberId,
          status,
          planName,
          planId: plan.id,
          role: "member",
          joinDate: joinDate.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          attendanceCount: Math.floor(Math.random() * 50),
          offenseCount: i % 7 === 0 ? 1 : 0,
          paymentStatus: status === "Active" ? "Paid" : "Unpaid",
          totalPaid: status === "Active" ? plan.price * (Math.floor(Math.random() * 6) + 1) : 0,
          profileImage: `https://i.pravatar.cc/150?u=${memberId}`,
          address: `${100 + i} Demo St, Tech City`,
          emergencyContact: `Emergency Contact ${i + 1} (555-9999)`
        };

        members.push({ id: memberRef.id, ...memberData });
        addOperation(memberRef, memberData);
      }

      // 4. Seed Payments (20)
      for (let i = 0; i < 20; i++) {
        const member = members[i % members.length];
        const paymentRef = db.collection("payments").doc();
        
        const paymentDate = new Date();
        paymentDate.setDate(paymentDate.getDate() - (i * 5));

        const paymentData = {
          memberId: member.memberId,
          memberDocId: member.id,
          fullName: member.fullName,
          amount: Math.floor(Math.random() * 100) + 50,
          method: i % 2 === 0 ? "Credit Card" : "Bank Transfer",
          status: "Paid",
          cardLast4: i % 2 === 0 ? "4242" : null,
          cardType: i % 2 === 0 ? "Visa" : null,
          paidAt: paymentDate.toISOString().split('T')[0],
          notes: "Demo transaction",
          paymentDate: paymentDate.toISOString().split('T')[0]
        };
        addOperation(paymentRef, paymentData);
      }

      // 5. Seed Notifications (10)
      const notifTypes = ["PAYMENT_SUCCESS", "MEMBERSHIP_EXPIRED", "WELCOME", "STATUS_CHANGE"];
      for (let i = 0; i < 10; i++) {
        const member = members[i % members.length];
        const notifRef = db.collection("notifications").doc();
        
        const notifData = {
          userId: member.id,
          title: `Demo Notification ${i + 1}`,
          message: `This is a demo notification message for ${member.fullName}.`,
          type: notifTypes[i % notifTypes.length],
          read: i % 3 === 0,
        };
        addOperation(notifRef, notifData);
      }

      // 6. Seed Audit Logs (15)
      const actions = ["LOGIN", "UPDATE_PROFILE", "RECORD_PAYMENT", "STATUS_SYNC", "ADD_MEMBER"];
      for (let i = 0; i < 15; i++) {
        const member = members[i % members.length];
        const logRef = db.collection("auditLogs").doc();
        
        const logData = {
          actorId: i % 2 === 0 ? "system" : "admin_123",
          actorName: i % 2 === 0 ? "System Automation" : "Admin User",
          action: actions[i % actions.length],
          targetType: "member",
          targetId: member.id,
          reason: `Demo audit entry ${i + 1} for ${member.fullName}`
        };
        addOperation(logRef, logData);
      }

      // Commit remaining batch
      if (opCount > 0) {
        batches.push(currentBatch);
      }

      for (const b of batches) {
        await b.commit();
      }

      return {
        success: true,
        message: "Database populated successfully",
        counts: {
          members: totalToSeed,
          payments: 20,
          notifications: 10,
          plans: plans.length,
          auditLogs: 15
        }
      };

    } catch (error) {
      logger.error("Error populating database:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
