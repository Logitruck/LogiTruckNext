import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

type UseProjectSetupDetailsResult = {
  project: any | null;
  loading: boolean;
};

const useProjectSetupDetails = (
  channelID?: string,
  projectID?: string,
): UseProjectSetupDetailsResult => {
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!channelID || !projectID) {
        setProject(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const projectRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
        );

        const projectSnap = await getDoc(projectRef);
  console.log('📦 projectSnap.exists =>', projectSnap.exists());
console.log('📦 project raw data =>', JSON.stringify(projectSnap.data(), null, 2));

      if (!projectSnap.exists()) {
  console.log('❌ Project doc not found', { channelID, projectID });
  setProject(null);
  return;
}

        setProject({
          id: projectSnap.id,
          ...projectSnap.data(),
        });
      } catch (error) {
        console.error('🔥 Error fetching project setup details:', error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [channelID, projectID]);

  return { project, loading };
};

export default useProjectSetupDetails;