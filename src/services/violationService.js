import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SEVERITY_POINTS } from '../rules/violationRules';
import { safeTimestampToDate } from '../utils/formatters';

const VIOLATIONS_COLLECTION = 'violations';

export const addViolation = async (orgId, violationData) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    const points = SEVERITY_POINTS[violationData.severity] || 1;
    return await addDoc(collection(db, VIOLATIONS_COLLECTION), {
      ...violationData,
      organizationId: orgId,
      points,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding violation:", error);
    throw error;
  }
};

export const getMemberViolations = async (orgId, memberId) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    const q = query(
      collection(db, VIOLATIONS_COLLECTION), 
      where("organizationId", "==", orgId),
      where('memberId', '==', memberId)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // In-memory sorting to avoid composite index requirement
    return data.sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));
  } catch (error) {
    console.error("Error fetching violations:", error);
    return [];
  }
};
