import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const useProjectPersonnel = (channelID?: string, projectID?: string) => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelID || !projectID) {
      setDrivers([]);
      setDispatchers([]);
      setLoading(false);
      return;
    }

    const projectRef = doc(
      db,
      'project_channels',
      channelID,
      'projects',
      projectID,
    );

    const unsubscribe = onSnapshot(
      projectRef,
      (snapshot) => {
        const data = snapshot.data() || {};

        setDrivers(
          Array.isArray(data?.carrierPersonnel?.drivers)
            ? data.carrierPersonnel.drivers
            : [],
        );

        setDispatchers(
          Array.isArray(data?.carrierPersonnel?.dispatchers)
            ? data.carrierPersonnel.dispatchers
            : [],
        );

        setLoading(false);
      },
      (error) => {
        console.error('🔥 Error fetching project personnel:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [channelID, projectID]);

  return {
    drivers,
    dispatchers,
    loading,
  };
};

export default useProjectPersonnel;