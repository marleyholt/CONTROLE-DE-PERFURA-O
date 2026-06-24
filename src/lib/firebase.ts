import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0690370750",
  appId: "1:54314622329:web:0573c21cba677e5b0023a8",
  apiKey: "AIzaSyDngNJ2ckBkTgPBxmwdTQvCaYx-9xhnVlg",
  authDomain: "gen-lang-client-0690370750.firebaseapp.com",
  storageBucket: "gen-lang-client-0690370750.firebasestorage.app",
  messagingSenderId: "54314622329",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const HOLES_COLLECTION = 'holes';
