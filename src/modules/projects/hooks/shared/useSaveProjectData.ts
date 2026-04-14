import { useCallback } from 'react';
import {
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../../../core/firebase/config';

type SaveProjectDataParams = {
  channelID: string;
  projectID: string;
  data: any;
  status?: string;
};

type MarkSetupFlagParams = {
  channelID: string;
  projectID: string;
  role: string;
};

const useSaveProjectData = () => {
  const saveProjectData = useCallback(
    async ({ channelID, projectID, data, status }: SaveProjectDataParams) => {
      if (!channelID || !projectID || !data) {
        console.warn(
          '❌ Missing channelID, projectID, or data in saveProjectData',
        );
        return;
      }

      try {
        const projectRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
        );

        const updateData: Record<string, any> = {
          requestID: data?.requestID ?? projectID,
          channelID: data?.channelID ?? channelID,
          finderID: data?.finderID ?? '',
          vendorID: data?.vendorID ?? '',
          name: data?.name ?? '',
          status: status ?? data?.status ?? 'setup',

          routes: Array.isArray(data?.routes) ? data.routes : [],
          totalRoutes: Number(data?.totalRoutes ?? 0),
          totalTrips: Number(data?.totalTrips ?? 0),
          acceptedOffer: data?.acceptedOffer ?? null,

          carrierResources: {
            trucks: Array.isArray(data?.carrierResources?.trucks)
              ? data.carrierResources.trucks
              : [],
            trailers: Array.isArray(data?.carrierResources?.trailers)
              ? data.carrierResources.trailers
              : [],
          },

          carrierPersonnel: {
            drivers: Array.isArray(data?.carrierPersonnel?.drivers)
              ? data.carrierPersonnel.drivers
              : [],
            dispatchers: Array.isArray(data?.carrierPersonnel?.dispatchers)
              ? data.carrierPersonnel.dispatchers
              : [],
          },

          carrierAvailability: {
            startDate: data?.carrierAvailability?.startDate ?? null,
            tripsPerDay:
              data?.carrierAvailability?.tripsPerDay != null
                ? Number(data.carrierAvailability.tripsPerDay)
                : null,
          },

          carrierNotes: data?.carrierNotes ?? '',

          updatedAt: serverTimestamp(),
        };

        await updateDoc(projectRef, updateData);

        console.log(`✅ Project ${projectID} saved to channel ${channelID}`);
      } catch (error) {
        console.error('🔥 Error saving project data:', error);
        throw error;
      }
    },
    [],
  );

  const markSetupFlag = useCallback(
    async ({ channelID, projectID, role }: MarkSetupFlagParams) => {
      if (!channelID || !projectID || !role) {
        console.warn(
          '❌ Missing channelID, projectID or role in markSetupFlag',
        );
        return;
      }

      try {
        const flagRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
          'setupFlags',
          role,
        );

        await setDoc(
          flagRef,
          {
            done: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        console.log(
          `✅ Setup flag saved for role '${role}' in project ${projectID}`,
        );
      } catch (error) {
        console.error('🔥 Error saving setup flag:', error);
        throw error;
      }
    },
    [],
  );

  return {
    saveProjectData,
    markSetupFlag,
  };
};

export default useSaveProjectData;