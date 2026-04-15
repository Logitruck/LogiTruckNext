// src/core/onboarding/hooks/useAuth.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { resolveActiveVendorID } from '../utils/resolveActiveVendorID';
import { resolveActiveRole } from '../utils/resolveActiveRole';
import {
  fetchAndStorePushTokenIfPossible,
  subscribeToPushTokenRefresh,
} from '../../notifications/pushToken';

type UserDocData = {
  id: string;
  vendorID?: string | null;
  vendorIDs?: string[];
  activeVendorID?: string | null;
  activeRole?: string | null;
  globalRoles?: string[];
  rolesArray?: string[];
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
};

type VendorUserDocData = {
  id: string;
  rolesArray?: string[];
  activeRole?: string | null;
  vendorID?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  [key: string]: any;
};

type AuthContextValue = {
  authUser: any;
  currentUser: any;
  userDoc: UserDocData | null;
  vendorUser: VendorUserDocData | null;
  activeVendorID: string | null;
  activeRole: string | null;
  availableVendorIDs: string[];
  availableRoles: string[];
  loading: boolean;
  authResolved: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  setActiveVendor: (vendorID: string) => Promise<void>;
  setActiveRole: (role: string) => Promise<void>;
  reloadSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
  authManager: {
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    subscribe: (callback: (user: any) => void) => () => void;
  };
};

export const AuthProvider = ({ children, authManager }: Props) => {
  const [authUser, setAuthUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<UserDocData | null>(null);
  const [vendorUser, setVendorUser] = useState<VendorUserDocData | null>(null);
  const [activeVendorID, setActiveVendorID] = useState<string | null>(null);
  const [activeRole, setActiveRoleState] = useState<string | null>(null);
  const [availableVendorIDs, setAvailableVendorIDs] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const clearSession = () => {
    setUserDoc(null);
    setVendorUser(null);
    setActiveVendorID(null);
    setActiveRoleState(null);
    setAvailableVendorIDs([]);
    setAvailableRoles([]);
  };

  const loadUserContext = async (firebaseUser: any) => {
    const uid = firebaseUser?.uid;

    if (!uid) {
      clearSession();
      return;
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      clearSession();
      return;
    }

    const userData: UserDocData = {
      id: userSnap.id,
      ...(userSnap.data() || {}),
    };

    const resolvedVendorID = resolveActiveVendorID(userData);

    let vendorUserData: VendorUserDocData | null = null;
    let resolvedRole: string | null = null;

    if (resolvedVendorID) {
      const vendorUserRef = doc(
        db,
        'vendor_users',
        resolvedVendorID,
        'users',
        uid,
      );

      const vendorUserSnap = await getDoc(vendorUserRef);

      if (vendorUserSnap.exists()) {
        vendorUserData = {
          id: vendorUserSnap.id,
          ...(vendorUserSnap.data() || {}),
        };
      }

      resolvedRole = resolveActiveRole(vendorUserData, userData);

      const needsUserPatch =
        userData.activeVendorID !== resolvedVendorID ||
        userData.activeRole !== resolvedRole;

      if (needsUserPatch) {
        await updateDoc(userRef, {
          activeVendorID: resolvedVendorID,
          activeRole: resolvedRole || null,
        });
      }
    }

    const mergedUser: UserDocData = {
      ...userData,
      activeVendorID: resolvedVendorID,
      activeRole: resolvedRole || null,
    };

    setUserDoc(mergedUser);
    setVendorUser(vendorUserData);
    setActiveVendorID(resolvedVendorID);
    setActiveRoleState(resolvedRole);

    setAvailableVendorIDs(
      Array.isArray(userData.vendorIDs) ? userData.vendorIDs : [],
    );

    setAvailableRoles(
      Array.isArray(vendorUserData?.rolesArray) ? vendorUserData.rolesArray : [],
    );
  };

useEffect(() => {
  const unsubscribe = authManager.subscribe(async (firebaseUser) => {
    console.log('🔥 AUTH STATE CHANGED:', firebaseUser);

    try {
      setLoading(true);
      setAuthUser(firebaseUser);

      if (!firebaseUser) {
        // Solo limpiar sesión, pero sin asumir aún navegación forzada
        clearSession();
        return;
      }

      console.log('✅ User restored:', firebaseUser.uid);
      await loadUserContext(firebaseUser);
    } catch (error) {
      console.error('🔥 AuthProvider error:', error);
      clearSession();
    } finally {
      setAuthResolved(true);
      setLoading(false);
    }
  });

  return unsubscribe;
}, [authManager]);

  

  const signIn = async (email: string, password: string) => {
    return authManager.signIn(email, password);
  };

  const signOut = async () => {
    await authManager.signOut();
  };

  const setActiveVendor = async (vendorID: string) => {
    if (!authUser?.uid || !vendorID) return;

    const userRef = doc(db, 'users', authUser.uid);
    await updateDoc(userRef, {
      activeVendorID: vendorID,
      activeRole: null,
    });

    await loadUserContext(authUser);
  };

  const setActiveRole = async (role: string) => {
    if (!authUser?.uid) return;

    const userRef = doc(db, 'users', authUser.uid);
    await updateDoc(userRef, {
      activeRole: role,
    });

    setActiveRoleState(role);
    setUserDoc((prev) =>
      prev
        ? {
            ...prev,
            activeRole: role,
          }
        : prev,
    );
  };

  const reloadSession = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      await loadUserContext(authUser);
    } finally {
      setLoading(false);
    }
  };

const currentUser = useMemo(() => {
  if (!userDoc) return null;

  return {
    ...userDoc,
    vendorUser,
    activeVendorID,
    vendorID: activeVendorID || userDoc?.vendorID || null,
    activeRole,
    role: activeRole || null,
  };
}, [userDoc, vendorUser, activeVendorID, activeRole]);

  const value: AuthContextValue = {
    authUser,
    currentUser,
    userDoc,
    vendorUser,
    activeVendorID,
    activeRole,
    availableVendorIDs,
    availableRoles,
    loading,
    authResolved,
    signIn,
    signOut,
    setActiveVendor,
    setActiveRole,
    reloadSession,
  };

  useEffect(() => {
  if (!currentUser?.id) {
    return;
  }

  let unsubscribeTokenRefresh: (() => void) | undefined;

  const setupPush = async () => {
    try {
      await fetchAndStorePushTokenIfPossible(currentUser);
      unsubscribeTokenRefresh = subscribeToPushTokenRefresh(currentUser.id);
    } catch (error) {
      console.error('🔥 Push setup error:', error);
    }
  };

  setupPush();

  return () => {
    unsubscribeTokenRefresh?.();
  };
}, [currentUser?.id]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export const useCurrentUser = () => {
  const { currentUser } = useAuth();
  return currentUser;
};