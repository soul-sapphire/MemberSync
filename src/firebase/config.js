import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDXOwjJtev50pdsCYj5ZNWOm5DoRPITCuo",
  authDomain: "membership-system-7eac9.firebaseapp.com",
  projectId: "membership-system-7eac9",
  storageBucket: "membership-system-7eac9.appspot.com",
  messagingSenderId: "244505243439",
  appId: "1:244505243439:web:ff099be726acec0f8f3bda"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");
export const googleProvider = new GoogleAuthProvider();

export default app;