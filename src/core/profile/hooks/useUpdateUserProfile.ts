import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useCurrentUser } from '../../onboarding/hooks/useAuth';
import { useTranslations } from '../../dopebase';

type UpdateProfileParams = {
  firstName: string;
  lastName: string;
  preferredLanguage: string;
};

export const useUpdateUserProfile = () => {
  const currentUser = useCurrentUser();
  const { setAppLocale } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = async ({
    firstName,
    lastName,
    preferredLanguage,
  }: UpdateProfileParams) => {
    const uid = currentUser?.id;
    if (!uid) return;

    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'users', uid), {
        firstName,
        lastName,
        preferredLanguage,
      });

      const vendorID = currentUser?.vendorID;
      if (vendorID) {
        await updateDoc(doc(db, 'vendor_users', vendorID, 'users', uid), {
          firstName,
          lastName,
          preferredLanguage,
        });
      }

      setAppLocale(preferredLanguage);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, updateProfile };
};
