import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
apiKey: "AIzaSyBrKJ1M1AaRyJPEjdSuwoeCka8-OMNVka4",
  authDomain: "logitruck-f6e40.firebaseapp.com",
  projectId: "logitruck-f6e40",
  storageBucket: "logitruck-f6e40.firebasestorage.app",
  messagingSenderId: "613066378079",
  appId: "1:613066378079:web:04a0137b507d9bca7f04ea",
  measurementId: "G-Y2TS5BFSSB"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;