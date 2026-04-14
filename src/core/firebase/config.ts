import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyBrKJ1M1AaRyJPEjdSuwoeCka8-OMNVka4',
  authDomain: 'logitruck-f6e40.firebaseapp.com',
  projectId: 'logitruck-f6e40',
  storageBucket: 'logitruck-f6e40.firebasestorage.app',
  messagingSenderId: '613066378079',
  appId: '1:613066378079:web:04a0137b507d9bca7f04ea',
  measurementId: 'G-Y2TS5BFSSB',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = firestore;
export const functions = getFunctions(app);

export const FieldValue = {
  serverTimestamp,
};

export const httpsCallableFunction = httpsCallable;

export const uploadMediaFunctionURL =
  'https://us-central1-development-69cdc.cloudfunctions.net/uploadMedia';

export default app;