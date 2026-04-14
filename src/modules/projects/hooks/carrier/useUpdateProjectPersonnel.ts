import { useState, useCallback } from 'react';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const useUpdateProjectPersonnel = (channelID?: string, projectID?: string) => {
  const [saving, setSaving] = useState(false);

  const getProjectRef = () => {
    if (!channelID || !projectID) {
      throw new Error('Missing channelID or projectID');
    }

    return doc(db, 'project_channels', channelID, 'projects', projectID);
  };

  const updateArray = useCallback(
    async (
      field: 'drivers' | 'dispatchers',
      updater: (current: any[]) => any[],
    ) => {
      const projectRef = getProjectRef();

      setSaving(true);
      try {
        const snap = await getDoc(projectRef);
        const data = snap.data() || {};

        const currentPersonnel = data?.carrierPersonnel || {};
        const currentArray = Array.isArray(currentPersonnel?.[field])
          ? currentPersonnel[field]
          : [];

        const nextArray = updater(currentArray);

        await updateDoc(projectRef, {
          [`carrierPersonnel.${field}`]: nextArray,
          updatedAt: serverTimestamp(),
        });
      } finally {
        setSaving(false);
      }
    },
    [channelID, projectID],
  );

  const addDriverToProject = useCallback(
    async (driver: any) => {
      await updateArray('drivers', (current) => {
        const exists = current.some((item: any) => item.id === driver.id);
        return exists ? current : [...current, driver];
      });
    },
    [updateArray],
  );

  const addDispatcherToProject = useCallback(
    async (dispatcher: any) => {
      await updateArray('dispatchers', (current) => {
        const exists = current.some((item: any) => item.id === dispatcher.id);
        return exists ? current : [...current, dispatcher];
      });
    },
    [updateArray],
  );

  const removeDriverFromProject = useCallback(
    async (driverID: string) => {
      await updateArray('drivers', (current) =>
        current.filter((item: any) => item.id !== driverID),
      );
    },
    [updateArray],
  );

  const removeDispatcherFromProject = useCallback(
    async (dispatcherID: string) => {
      await updateArray('dispatchers', (current) =>
        current.filter((item: any) => item.id !== dispatcherID),
      );
    },
    [updateArray],
  );

  return {
    saving,
    addDriverToProject,
    addDispatcherToProject,
    removeDriverFromProject,
    removeDispatcherFromProject,
  };
};

export default useUpdateProjectPersonnel;