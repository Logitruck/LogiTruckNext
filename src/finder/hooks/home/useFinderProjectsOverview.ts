import { useMemo } from 'react';
import useFinderProjects from '../../../modules/projects/hooks/finder/useFinderProjects';

type FinderProjectOverviewCounts = {
  setup: number;
  execution: number;
  completed: number;
};

const useFinderProjectsOverview = () => {
  const { projects = [], loading } = useFinderProjects();

  const counts = useMemo<FinderProjectOverviewCounts>(() => {
    return projects.reduce(
      (acc: FinderProjectOverviewCounts, project: any) => {
        const status = project?.status;

        if (status === 'setup') {
          acc.setup += 1;
        } else if (status === 'execution') {
          acc.execution += 1;
        } else if (status === 'completed') {
          acc.completed += 1;
        }

        return acc;
      },
      {
        setup: 0,
        execution: 0,
        completed: 0,
      },
    );
  }, [projects]);

  return {
    counts,
    loading,
  };
};

export default useFinderProjectsOverview;