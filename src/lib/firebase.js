import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, setPersistence,
  browserLocalPersistence, signInWithPopup, signOut, onAuthStateChanged
} from "firebase/auth";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);

export async function loginWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function logout() { return signOut(auth); }
export function listenAuth(cb) { return onAuthStateChanged(auth, cb); }
