import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const PLANS_COLLECTION = 'membershipPlans';

export const getPlans = async () => {
  const querySnapshot = await getDocs(collection(db, PLANS_COLLECTION));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addPlan = async (planData) => {
  return await addDoc(collection(db, PLANS_COLLECTION), {
    ...planData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updatePlan = async (id, planData) => {
  const docRef = doc(db, PLANS_COLLECTION, id);
  await updateDoc(docRef, {
    ...planData,
    updatedAt: serverTimestamp()
  });
};

export const deletePlan = async (id) => {
  await deleteDoc(doc(db, PLANS_COLLECTION, id));
};
