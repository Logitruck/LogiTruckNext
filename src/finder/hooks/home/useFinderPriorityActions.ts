import { useMemo } from 'react';
import useFinderDealsOverview from './useFinderDealsOverview';
import useFinderProjectsOverview from './useFinderProjectsOverview';

type FinderPrioritySeverity = 'low' | 'medium' | 'high';

export type FinderPriorityActionItem = {
  id: string;
  label: string;
  count: number;
  severity: FinderPrioritySeverity;
  icon: string;
  target?: {
    routeName: string;
    params?: any;
  };
};

const getSeverity = (count: number): FinderPrioritySeverity => {
  if (count >= 5) return 'high';
  if (count >= 1) return 'medium';
  return 'low';
};

const useFinderPriorityActions = () => {
  const {
    counts: dealCounts,
    loading: dealsLoading,
  } = useFinderDealsOverview();

  const {
    counts: projectCounts,
    loading: projectsLoading,
  } = useFinderProjectsOverview();

  const actions = useMemo<FinderPriorityActionItem[]>(() => {
    const base: FinderPriorityActionItem[] = [
      {
        id: 'offers_received',
        label: 'Offers received',
        count: dealCounts.offered || 0,
        severity: getSeverity(dealCounts.offered || 0),
        icon: 'tag-outline',
        target: {
          routeName: 'FinderDealsTab',
          params: {
            screen: 'Deals',
            params: { status: 'offered' },
          },
        },
      },
      {
        id: 'contracts_to_sign',
        label: 'Contracts to sign',
        count: dealCounts.to_sign || 0,
        severity: getSeverity(dealCounts.to_sign || 0),
        icon: 'pen',
        target: {
          routeName: 'FinderDealsTab',
          params: {
            screen: 'Deals',
            params: { status: 'to_sign' },
          },
        },
      },
      {
        id: 'projects_execution',
        label: 'Projects in execution',
        count: projectCounts.execution || 0,
        severity: getSeverity(projectCounts.execution || 0),
        icon: 'truck-fast-outline',
        target: {
          routeName: 'FinderProjectsTab',
          params: {
            screen: 'ProjectsMain',
            params: {
              screen: 'ProjectsHome',
              params: { status: 'execution' },
            },
          },
        },
      },
    ];

    return base
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [dealCounts, projectCounts]);

  return {
    actions,
    loading: dealsLoading || projectsLoading,
  };
};

export default useFinderPriorityActions;