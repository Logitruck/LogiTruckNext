import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type DriverChatParticipant = {
  id: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: string;
  rolesArray?: string[];
  profilePictureURL?: string;
  [key: string]: any;
};

const useDriverChatParticipants = () => {
  const currentUser = useCurrentUser();

  const [participants, setParticipants] = useState<DriverChatParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const vendorID = currentUser?.vendorID || currentUser?.activeVendorID;
    const currentUserID = currentUser?.id || currentUser?.userID;

    if (!vendorID || !currentUserID) {
      setParticipants([]);
      return;
    }

    setLoading(true);

    const usersRef = collection(doc(collection(db, 'vendor_users'), vendorID), 'users');

    const q = query(
      usersRef,
      where('status', '==', 'active'),
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs
          .map(docSnap => {
            const data = docSnap.data();

            return {
              id: docSnap.id,
              ...data,
            } as DriverChatParticipant;
          })
          .filter(user => {
            const participantID = user.id || user.userID;

            if (participantID === currentUserID) {
              return false;
            }

            return (
              user.rolesArray?.includes('dispatch') ||
              user.rolesArray?.includes('manager')
            );
          });

        setParticipants(list);
        setLoading(false);
      },
      error => {
        console.log('Error loading driver chat participants:', error);
        setParticipants([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser?.id, currentUser?.userID, currentUser?.vendorID, currentUser?.activeVendorID]);

  return {
    participants,
    loading,
  };
};

export default useDriverChatParticipants;