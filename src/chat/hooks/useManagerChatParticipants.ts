import { useMemo } from 'react';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';
import useCompanyDrivers from './useCompanyDrivers';

const useManagerChatParticipants = () => {
  const currentUser = useCurrentUser();
  const currentUserID = currentUser?.id || currentUser?.userID;
// console.log('currentUser in useCompanyDrivers', currentUser);

  const { drivers, loading } = useCompanyDrivers();
// console.log('in drivers', drivers);
  const participants = useMemo(() => {
    if (!drivers) {
      return [];
    }

    // 🔹 ya vienen normalizados → solo filtramos
    return drivers
      .filter(driver => driver?.id && driver.id !== currentUserID)
      .map(driver => ({
        ...driver,
        raw: driver, // opcional, pero útil si luego necesitas data completa
      }));
  }, [drivers, currentUserID]);

  return {
    participants,
    loading,
  };
};

export default useManagerChatParticipants;