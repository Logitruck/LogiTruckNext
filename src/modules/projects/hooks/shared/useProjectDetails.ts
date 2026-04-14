import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const useProjectDetails = (channelID?: string, projectID?: string) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelID || !projectID) {
      setProject(null);
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
        if (!snapshot.exists()) {
          setProject(null);
          setLoading(false);
          return;
        }

        setProject({
          id: snapshot.id,
          channelID,
          ...snapshot.data(),
        });
        setLoading(false);
      },
      (error) => {
        console.error('🔥 Error fetching project details:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [channelID, projectID]);

  return {
    project,
    loading,
  };
};

export default useProjectDetails;