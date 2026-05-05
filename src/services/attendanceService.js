import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { safeTimestampToDate } from '../utils/formatters';

const ATTENDANCE_COLLECTION = 'attendance';

export const recordAttendance = async (orgId, attendanceData) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    return await addDoc(collection(db, ATTENDANCE_COLLECTION), {
      ...attendanceData,
      organizationId: orgId,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw error;
  }
};

export const getMemberAttendance = async (orgId, memberId) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION), 
      where("organizationId", "==", orgId),
      where('memberId', '==', memberId)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory to avoid index requirements
    return data.sort((a, b) => safeTimestampToDate(b.date || b.createdAt) - safeTimestampToDate(a.date || a.createdAt));
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
};
