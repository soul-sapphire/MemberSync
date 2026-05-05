import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, getDocs, collection, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebase/config";

/**
 * Helper to compress an image file to a small Base64 string for PDF exports.
 */
const generateThumbnailBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a member's profile photo to Firebase Storage and updates their Firestore document.
 * @param {string} uid - The member's user ID.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} - The download URL of the uploaded photo.
 */
export const uploadMemberProfilePhoto = async (uid, file) => {
  if (!uid) throw new Error("User ID is required");
  if (!file) throw new Error("No file provided");

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File is too large. Maximum size is 5MB.");
  }

  try {
    console.log(`Starting upload for UID: ${uid}, File: ${file.name}`);
    
    // Generate Base64 thumbnail before upload
    const profilePhotoBase64 = await generateThumbnailBase64(file);
    
    // 1. Upload to Firebase Storage
    const extension = file.name.split('.').pop();
    const storagePath = `member-profile-photos/${uid}/profile.${extension}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`Upload successful. URL: ${downloadURL}`);

    // 2. Update Firestore member document
    const updateData = {
      profilePhoto: downloadURL,
      photoURL: downloadURL,
      profileImage: downloadURL,
      ...(profilePhotoBase64 && { profilePhotoBase64 }),
      updatedAt: serverTimestamp()
    };

    // Check if doc exists with uid as ID
    const directRef = doc(db, "members", uid);
    const directSnap = await getDoc(directRef);

    if (directSnap.exists()) {
      console.log(`Updating member document with ID (UID): ${uid}`);
      await updateDoc(directRef, updateData);
    } else {
      // Search for doc where uid field matches
      console.log(`Direct document not found for ${uid}, searching via query...`);
      const q = query(collection(db, "members"), where("uid", "==", uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        console.log(`Updating member document with ID: ${snap.docs[0].id}`);
        await updateDoc(docRef, updateData);
      } else {
        console.warn(`No member document found for UID: ${uid} to update profile photo.`);
      }
    }

    return downloadURL;
  } catch (error) {
    console.error("Error in uploadMemberProfilePhoto:", error);
    throw error;
  }
};
