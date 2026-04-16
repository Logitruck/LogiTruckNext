import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {  serverTimestamp } from 'firebase/firestore';
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

const getReactNativePersistence = (FirebaseAuth as any)
  .getReactNativePersistence as ((storage: any) => any) | undefined;

export const auth = (() => {
  try {
    if (getReactNativePersistence) {
      return FirebaseAuth.initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }

    return FirebaseAuth.getAuth(app);
  } catch {
    return FirebaseAuth.getAuth(app);
  }
})();

export const db = getFirestore(app);

export const firestore = getFirestore(app);

export const functions = getFunctions(app);

export const FieldValue = {
  serverTimestamp,
};

export const httpsCallableFunction = httpsCallable;


export default app;





