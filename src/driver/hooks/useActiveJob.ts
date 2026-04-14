import { useEffect, useState } from 'react';
import {
  collectionGroup,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';

const useActiveJob = (driverID?: string | null, jobIDOverride?: string | null) => {
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverID) {
      setActiveJob(null);
      setLoading(false);
      return;
    }

    let unsubscribeJob: (() => void) | null = null;
    let unsubscribeFallback: (() => void) | null = null;

    const clearNestedListeners = () => {
      if (unsubscribeJob) {
        unsubscribeJob();
        unsubscribeJob = null;
      }

      if (unsubscribeFallback) {
        unsubscribeFallback();
        unsubscribeFallback = null;
      }
    };

    const subscribeToJobDoc = (
      channelID: string,
      projectID: string,
      jobID: string,
    ) => {
      const jobRef = doc(
        db,
        'project_channels',
        channelID,
        'projects',
        projectID,
        'jobs',
        jobID,
      );

      unsubscribeJob = onSnapshot(
        jobRef,
        snapshot => {
          if (!snapshot.exists()) {
            setActiveJob(null);
            setLoading(false);
            return;
          }

          const data = snapshot.data();

          setActiveJob({
            id: snapshot.id,
            ...data,
            channelID,
            projectID,
          });

          setLoading(false);
        },
        error => {
          console.error('🔥 Error listening to active job document:', error);
          setActiveJob(null);
          setLoading(false);
        },
      );
    };

    const subscribeFallbackJob = () => {
      const jobsQuery = query(
        collectionGroup(db, 'jobs'),
        where('assignedDriverID', '==', driverID),
        where('status', '==', 'in_progress'),
        limit(1),
      );

      unsubscribeFallback = onSnapshot(
        jobsQuery,
        snapshot => {
          if (snapshot.empty) {
            setActiveJob(null);
            setLoading(false);
            return;
          }

          const jobDoc = snapshot.docs[0];
          const data = jobDoc.data();

          const pathSegments = jobDoc.ref.path.split('/');
          const channelID = pathSegments[1] || null;
          const projectID = pathSegments[3] || null;

          setActiveJob({
            id: jobDoc.id,
            ...data,
            channelID,
            projectID,
          });

          setLoading(false);
        },
        error => {
          console.error('🔥 Error listening fallback active job:', error);
          setActiveJob(null);
          setLoading(false);
        },
      );
    };

    const userRef = doc(db, 'users', driverID);

    const unsubscribeUser = onSnapshot(
      userRef,
      userSnap => {
        clearNestedListeners();

        const userData = userSnap.data();
        const jobRefInfo = userData?.activeJob || null;

        if (
          jobRefInfo?.jobID &&
          jobRefInfo?.projectID &&
          jobRefInfo?.channelID
        ) {
          subscribeToJobDoc(
            jobRefInfo.channelID,
            jobRefInfo.projectID,
            jobRefInfo.jobID,
          );
          return;
        }

        if (jobIDOverride) {
          subscribeFallbackJob();
          return;
        }

        subscribeFallbackJob();
      },
      error => {
        console.error('🔥 Error listening to user activeJob:', error);
        clearNestedListeners();
        subscribeFallbackJob();
      },
    );

    return () => {
      unsubscribeUser();
      clearNestedListeners();
    };
  }, [driverID, jobIDOverride]);

  return { activeJob, loading };
};

export default useActiveJob;