// src/core/onboarding/api/index.ts
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../../firebase/config';

export const authManager = {
  signIn: async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  signOut: async () => {
    return signOut(auth);
  },

  subscribe: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};