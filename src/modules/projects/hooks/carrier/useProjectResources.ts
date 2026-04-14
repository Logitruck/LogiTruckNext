import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const useProjectResources = (channelID?: string, projectID?: string) => {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelID || !projectID) {
      setTrucks([]);
      setTrailers([]);
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

        setTrucks(
          Array.isArray(data?.carrierResources?.trucks)
            ? data.carrierResources.trucks
            : [],
        );

        setTrailers(
          Array.isArray(data?.carrierResources?.trailers)
            ? data.carrierResources.trailers
            : [],
        );

        setLoading(false);
      },
      (error) => {
        console.error('🔥 Error fetching project resources:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [channelID, projectID]);

  return {
    trucks,
    trailers,
    loading,
  };
};

export default useProjectResources;