import { initializeApp } from 'firebase/app';
import { Platform } from 'react-native';
// Imported from '@firebase/auth' directly (not the 'firebase' wrapper package):
// the wrapper's "./auth" export map has no "react-native" condition, so on
// Android/iOS it resolves to the browser build, which lacks
// getReactNativePersistence. The underlying @firebase/auth package declares
// the condition correctly, so Metro resolves it to the RN-specific build.
//
// Each platform's build only implements its OWN persistence helper —
// getReactNativePersistence on native, browserLocalPersistence on web — the
// other one is undefined on that platform's bundle, so only the matching
// one is ever called below.
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  setPersistence,
} from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBtnv_KGZr7ElWA9CNH93BHK7pHV72GG48",
  authDomain: "larga-614bd.firebaseapp.com",
  projectId: "larga-614bd",
  storageBucket: "larga-614bd.firebasestorage.app",
  messagingSenderId: "368429383653",
  appId: "1:368429383653:web:f5775977387c21c962790c",
  measurementId: "G-6QVPEWYKTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
//
// The persistence that survives an app restart, kept as a single instance so
// initializeAuth below and setSessionPersistence share the same object —
// switching back to it is then a no-op rather than a fresh migration.
const PERSISTENT_SESSION =
  Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(ReactNativeAsyncStorage);

export const auth = initializeAuth(app, { persistence: PERSISTENT_SESSION });

export const db = getFirestore(app);
export const storage = getStorage(app);

// Backs the "Remember me" / "Keep me logged in" checkbox on the login
// screens. Call it BEFORE signing in — it decides where the session is kept:
//   remember = true  -> written to the phone, so reopening the app stays logged in
//   remember = false -> held in memory only, so nothing touches storage and
//                       fully closing the app signs the user out. (Merely
//                       backgrounding the app does not — the process is still
//                       alive, so the session is too.)
export function setSessionPersistence(remember) {
  return setPersistence(auth, remember ? PERSISTENT_SESSION : inMemoryPersistence);
}

export default app;
