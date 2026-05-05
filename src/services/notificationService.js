import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getNotificationTemplate } from '../rules/notificationRules';
import { safeTimestampToDate } from '../utils/formatters';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const sendNotification = async (orgId, userId, type, data = {}) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    const template = getNotificationTemplate(type, data);
    return await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      organizationId: orgId,
      userId,
      ...template,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const getUserNotifications = async (orgId, userId) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    // Simplified query to avoid composite index (where + orderBy)
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION), 
      where("organizationId", "==", orgId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory using safe utility
    return data.sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
       throw error; 
    }
    return [];
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};
