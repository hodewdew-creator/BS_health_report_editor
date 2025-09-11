import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 로그인
export async function loginWithGoogle() {
  await setPersistence(auth, browserLocalPersistence); // 로그인 유지
  return signInWithPopup(auth, provider);
}

// 로그아웃
export async function logout() {
  return signOut(auth);
}

// 상태 변화 듣기
export function listenAuth(cb) {
  return onAuthStateChanged(auth, cb);
}
