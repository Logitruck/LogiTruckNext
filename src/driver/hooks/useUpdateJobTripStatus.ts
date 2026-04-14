import { useCallback } from 'react';
import {
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';

const useUpdateJobTripStatus = (
  channelID?: string | null,
  projectID?: string | null,
) => {
  const updateTripStatus = useCallback(
    async (
      jobID?: string | null,
      tripStatus?: string | null,
      driverID: string | null = null,
    ) => {
      if (!channelID || !projectID || !jobID || !tripStatus) {
        console.warn('❌ Missing parameters for updating trip status');
        return;
      }

      try {
        const jobRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
          'jobs',
          jobID,
        );

        const updates: Record<string, any> = {
          tripStatus,
          tripStatusUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (tripStatus === 'arrived_at_pickup') {
          updates['delivery.pickedUp'] = serverTimestamp();
        }

        if (tripStatus === 'completed') {
          updates.completedAt = serverTimestamp();
          updates.status = 'completed';
        }

        await updateDoc(jobRef, updates);

        if (tripStatus === 'completed' && driverID) {
          const userRef = doc(db, 'users', driverID);

          await updateDoc(userRef, {
            activeJob: deleteField(),
            updatedAt: serverTimestamp(),
          });
        }

        console.log(
          `✅ Trip status for job ${jobID} updated to '${tripStatus}'`,
        );
      } catch (error) {
        console.error('🔥 Error updating trip status:', error);
      }
    },
    [channelID, projectID],
  );

  return { updateTripStatus };
};

export default useUpdateJobTripStatus;