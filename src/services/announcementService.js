import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { safeTimestampToDate } from '../utils/formatters';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

export const getAnnouncements = async (organizationId = 'default') => {
  try {
    const q = query(
      collection(db, ANNOUNCEMENTS_COLLECTION), 
      where('organizationId', '==', organizationId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory to avoid index requirement for where + orderBy
    return data.sort((a, b) => safeTimestampToDate(b.createdAt) - safeTimestampToDate(a.createdAt));
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error;
  }
};

export const addAnnouncement = async (data, organizationId = 'default') => {
  return await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
    ...data,
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateAnnouncement = async (id, data) => {
  const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteAnnouncement = async (id) => {
  await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, id));
};
