import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";

const MEMBERS_COLLECTION = "members";

/**
 * Fetches all members for a specific organization with filtering support
 */
export const getMembers = async (orgId, filters = {}) => {
  if (!orgId) throw new Error("Organization ID is required");

  try {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where("organizationId", "==", orgId)
    );

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(0)
      };
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(m => 
        (m.fullName || "").toLowerCase().includes(searchLower) || 
        (m.email || "").toLowerCase().includes(searchLower) ||
        (m.memberId || "").toLowerCase().includes(searchLower)
      );
    }

    if (filters.status && filters.status !== 'All') {
      results = results.filter(m => m.status === filters.status);
    }

    if (filters.plan && filters.plan !== 'All') {
      results = results.filter(m => m.planName === filters.plan);
    }

    results.sort((a, b) => {
      if (filters.sortBy === 'oldest') {
        return a.createdAtDate - b.createdAtDate;
      } else if (filters.sortBy === 'name') {
        return (a.fullName || "").localeCompare(b.fullName || "");
      }
      return b.createdAtDate - a.createdAtDate;
    });

    return results;
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
};

/**
 * Fetches a single member by ID
 */
export const getMemberById = async (memberId) => {
  if (!memberId) throw new Error("Member ID is required");
  
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching member:", error);
    throw error;
  }
};

/**
 * Fetches a single member by their Firebase Auth UID
 */
export const getMemberByUid = async (arg1, arg2) => {
  const uid = arg2 || arg1;
  if (!uid) return null;

  const directRef = doc(db, "members", uid);
  const directSnap = await getDoc(directRef);

  if (directSnap.exists()) {
    return {
      id: directSnap.id,
      ...directSnap.data()
    };
  }

  const q = query(collection(db, "members"), where("uid", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const d = snap.docs[0];

  return {
    id: d.id,
    ...d.data()
  };
};

/**
 * Adds a new member
 */
export const addMember = async (orgId, data) => {
  if (!orgId) throw new Error("Organization ID is required");

  try {
    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), {
      ...data,
      organizationId: orgId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};

/**
 * Updates a member
 */
export const updateMember = async (memberId, data) => {
  if (!memberId) throw new Error("Member ID is required");

  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating member:", error);
    throw error;
  }
};

/**
 * Deletes a member
 */
export const deleteMember = async (memberId) => {
  if (!memberId) throw new Error("Member ID is required");
  
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting member:", error);
    throw error;
  }
};