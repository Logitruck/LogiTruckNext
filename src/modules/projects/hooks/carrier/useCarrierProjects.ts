import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '../../../../core/firebase/config';
import {useCurrentUser}  from '../../../../core/onboarding/hooks/useAuth';

type ProjectItem = {
  id: string;
  channelID: string;
  status?: 'setup' | 'execution' | 'completed' | string;
  [key: string]: any;
};

type Counters = {
  setup: number;
  execution: number;
  completed: number;
};

const initialCounters: Counters = {
  setup: 0,
  execution: 0,
  completed: 0,
};

const useCarrierProjects = () => {
  const currentUser = useCurrentUser();
  console.log('currentUser usecarrier proyects', currentUser)
  const carrierID = currentUser?.vendorID || currentUser?.id || null;
console.log('carrierID', carrierID)
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [counters, setCounters] = useState<Counters>(initialCounters);

  useEffect(() => {
    if (!carrierID) {
      setProjects([]);
      setCounters(initialCounters);
      setLoading(false);
      return;
    }

    const channelQuery = query(
      collection(db, "project_channels"),
      where("companiesParticipantIDs", "array-contains", carrierID),
    );

    let projectUnsubscribers: Array<() => void> = [];

    const unsubscribeChannels = onSnapshot(
      channelQuery,
      (channelSnapshot) => {
        projectUnsubscribers.forEach((unsubscribe) => unsubscribe());
        projectUnsubscribers = [];

        if (channelSnapshot.empty) {
          setProjects([]);
          setCounters(initialCounters);
          setLoading(false);
          return;
        }

        const projectsByChannel: Record<string, ProjectItem[]> = {};

        const recomputeAll = () => {
          const mergedProjects = Object.values(projectsByChannel).flat();

          mergedProjects.sort((a, b) => {
            const aDate = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
            const bDate = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
            return bDate - aDate;
          });

          const nextCounters: Counters = {
            setup: 0,
            execution: 0,
            completed: 0,
          };

          mergedProjects.forEach((project) => {
            if (project.status === "setup") nextCounters.setup += 1;
            if (project.status === "execution") nextCounters.execution += 1;
            if (project.status === "completed") nextCounters.completed += 1;
          });

          setProjects(mergedProjects);
          setCounters(nextCounters);
          setLoading(false);
        };

        channelSnapshot.docs.forEach((channelDoc) => {
          const channelID = channelDoc.id;

          const projectsRef = collection(
            db,
            "project_channels",
            channelID,
            "projects",
          );

          const unsubscribeProjects = onSnapshot(
            projectsRef,
            (projectSnapshot) => {
              projectsByChannel[channelID] = projectSnapshot.docs.map(
                (projectDoc) =>
                  ({
                    id: projectDoc.id,
                    channelID,
                    ...projectDoc.data(),
                  }) as ProjectItem,
              );

              recomputeAll();
            },
            (err) => {
              console.error(
                "[useCarrierProjects] Error in projects listener:",
                err,
              );
              setError(err);
              setLoading(false);
            },
          );

          projectUnsubscribers.push(unsubscribeProjects);
        });
      },
      (err) => {
        console.error("[useCarrierProjects] Error in channels listener:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeChannels();
      projectUnsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [carrierID]);

  return {
    projects,
    loading,
    error,
    counters,
  };
};

export default useCarrierProjects;