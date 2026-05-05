import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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

/**
 * Real-time listener for user notifications
 * @param {string} orgId 
 * @param {string} userId 
 * @param {function} callback 
 * @returns {function} unsubscribe
 */
export const subscribeToUserNotifications = (orgId, userId, callback) => {
  // GUARD: If IDs are missing, return empty unsubscribe
  if (!orgId || !userId) {
    console.warn("Missing orgId or userId for notification subscription");
    callback([]);
    return () => {};
  }

  try {
    // Simplified query to avoid composite index requirement during development
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION), 
      where("organizationId", "==", orgId),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory using safe utility to avoid Firestore index errors
      const sorted = data.sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));
      callback(sorted);
    }, (error) => {
      console.error("Notification listener error:", error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up notification listener:", error);
    callback([]);
    return () => {};
  }
};

export const getUserNotifications = async (orgId, userId) => {
  if (!orgId || !userId) return [];
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION), 
      where("organizationId", "==", orgId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));
  } catch (error) {
    console.error("Error fetching notifications:", error);
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
