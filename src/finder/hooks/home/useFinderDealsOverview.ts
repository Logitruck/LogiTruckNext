import useDealsByTab from '../useDealsByTab';

type FinderDealsOverviewCounts = {
  sending: number;
  offered: number;
  accepted: number;
  to_sign: number;
  execution: number;
};

const useFinderDealsOverview = () => {
  const { counters, loading } = useDealsByTab('sending');

  const counts: FinderDealsOverviewCounts = {
    sending: counters?.sending || 0,
    offered: counters?.offered || 0,
    accepted: counters?.accepted || 0,
    to_sign: counters?.to_sign || 0,
    execution: counters?.execution || 0,
  };

  return {
    counts,
    loading,
  };
};

export default useFinderDealsOverview;