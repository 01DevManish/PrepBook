import { initializeApp, getApps, getApp, } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBKH6cJAnLz-SlIG8RlYIamdnkoBhrRgXA",
  authDomain: "examprep-deae0.firebaseapp.com",
  projectId: "examprep-deae0",
  storageBucket: "examprep-deae0.firebasestorage.app",
  messagingSenderId: "1082868591464",
  appId: "1:1082868591464:web:e69f6c98698746938484dd",
  measurementId: "G-WWTZVF19KH"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db,storage  };