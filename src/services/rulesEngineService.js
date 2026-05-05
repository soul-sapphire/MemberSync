import { httpsCallable } from "firebase/functions";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db, functions } from "../firebase/config";
import { safeTimestampToDate } from "../utils/formatters";

/**
 * Manually trigger the membership rules engine
 * @param {string} organizationId 
 * @param {boolean} dryRun - If true, simulate updates without writing to Firestore
 * @returns {Promise<Object>} Summary of the run
 */
export const runMembershipRulesEngineNow = async (organizationId = "default", dryRun = false) => {
  const fn = httpsCallable(functions, "runMembershipRulesEngineNow");
  const result = await fn({ organizationId, dryRun });
  return result.data;
};

/**
 * Fetch maintenance run history
 * @param {string} organizationId 
 * @returns {Promise<Array>} List of maintenance runs
 */
export const getMaintenanceRuns = async (organizationId = "default") => {
  try {
    const q = query(
      collection(db, "maintenanceRuns"), 
      where("organizationId", "==", organizationId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));
  } catch (error) {
    console.error("Error fetching maintenance runs:", error);
    return [];
  }
};

/**
 * Fetch open admin review tasks
 * @param {string} organizationId 
 * @returns {Promise<Array>} List of review tasks
 */
export const getAdminReviewTasks = async (organizationId = "default") => {
  try {
    const q = query(
      collection(db, "adminReviewTasks"), 
      where("organizationId", "==", organizationId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));
  } catch (error) {
    console.error("Error fetching admin review tasks:", error);
    return [];
  }
};

/**
 * Update an admin review task status
 * @param {string} taskId 
 * @param {Object} data 
 */
export const updateAdminReviewTask = async (taskId, data) => {
  const docRef = doc(db, "adminReviewTasks", taskId);
  return await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};
