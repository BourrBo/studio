import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

// Initialize Firebase only if the configuration is valid.
// This prevents server crashes when environment variables are not set.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Firebase initialization failed. Please check your .env file.", e);
    app = null;
    auth = null;
    storage = null;
  }
} else {
    // On the server, log a warning if the config is missing.
    if (typeof window === 'undefined') {
        console.warn("\nWARNING: Firebase config is incomplete. Firebase features (Auth, Cloud Storage) will be disabled. Please add your Firebase credentials to the .env file.\n");
    }
}

export { app, auth, storage };
