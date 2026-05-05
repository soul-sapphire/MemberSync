import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export const uploadProfileImage = async (userId, file) => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const storageRef = ref(storage, `profiles/${userId}/avatar_${Date.now()}.${fileExt}`);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Error uploading image: ", error);
    throw error;
  }
};
