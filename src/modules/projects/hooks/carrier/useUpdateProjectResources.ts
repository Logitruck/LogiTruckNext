import { useState, useCallback } from 'react';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const useUpdateProjectResources = (channelID?: string, projectID?: string) => {
  const [saving, setSaving] = useState(false);

  const getProjectRef = () => {
    if (!channelID || !projectID) {
      throw new Error('Missing channelID or projectID');
    }

    return doc(db, 'project_channels', channelID, 'projects', projectID);
  };

  const updateArray = useCallback(
    async (field: 'trucks' | 'trailers', updater: (current: any[]) => any[]) => {
      const projectRef = getProjectRef();

      setSaving(true);
      try {
        const snap = await getDoc(projectRef);
        const data = snap.data() || {};

        const currentResources = data?.carrierResources || {};
        const currentArray = Array.isArray(currentResources?.[field])
          ? currentResources[field]
          : [];

        const nextArray = updater(currentArray);

        await updateDoc(projectRef, {
          [`carrierResources.${field}`]: nextArray,
          updatedAt: serverTimestamp(),
        });
      } finally {
        setSaving(false);
      }
    },
    [channelID, projectID],
  );

  const addTruckToProject = useCallback(
    async (truck: any) => {
      await updateArray('trucks', (current) => {
        const exists = current.some((item: any) => item.id === truck.id);
        return exists ? current : [...current, truck];
      });
    },
    [updateArray],
  );

  const addTrailerToProject = useCallback(
    async (trailer: any) => {
      await updateArray('trailers', (current) => {
        const exists = current.some((item: any) => item.id === trailer.id);
        return exists ? current : [...current, trailer];
      });
    },
    [updateArray],
  );

  const removeTruckFromProject = useCallback(
    async (truckID: string) => {
      await updateArray('trucks', (current) =>
        current.filter((item: any) => item.id !== truckID),
      );
    },
    [updateArray],
  );

  const removeTrailerFromProject = useCallback(
    async (trailerID: string) => {
      await updateArray('trailers', (current) =>
        current.filter((item: any) => item.id !== trailerID),
      );
    },
    [updateArray],
  );

  return {
    saving,
    addTruckToProject,
    addTrailerToProject,
    removeTruckFromProject,
    removeTrailerFromProject,
  };
};

export default useUpdateProjectResources;