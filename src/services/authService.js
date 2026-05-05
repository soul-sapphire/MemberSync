import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

const ADMIN_EMAIL = 'ruu035@gmail.com';

/**
 * Robust user document creation/sync logic.
 * Ensures critical fields like role and organizationId are never accidentally overwritten 
 * by the frontend if they already exist.
 */
const syncUserDocument = async (user, orgId = 'default') => {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    // New User Creation
    const userData = {
      uid: user.uid,
      email: user.email,
      fullName: user.displayName || 'New Member',
      photoURL: user.photoURL || null,
      organizationId: orgId,
      // CRITICAL: Role assignment logic is restricted here
      role: user.email === ADMIN_EMAIL ? 'admin' : 'member',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(userRef, userData);
    return userData;
  } else {
    // Existing User Sync
    const existingData = userDoc.data();
    
    // Ensure admin email always has admin role even if it was changed
    let roleUpdate = {};
    if (user.email === ADMIN_EMAIL && existingData.role !== 'admin') {
      roleUpdate = { role: 'admin' };
    }

    const updatePayload = {
      ...roleUpdate,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updatePayload);
    return { ...existingData, ...updatePayload };
  }
};

export const registerWithEmail = async (email, password, fullName, orgId = 'default') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: fullName });
    await syncUserDocument(user, orgId);
    
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const signInWithGoogle = async (orgId = 'default') => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userData = await syncUserDocument(result.user, orgId);
    return { user: result.user, userData };
  } catch (error) {
    console.error("Google Sign-In error:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const getUserData = async (uid) => {
  if (!uid) return null;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};
