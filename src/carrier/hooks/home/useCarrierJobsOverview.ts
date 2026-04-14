import useCarrierJobsList from '../useCarrierJobsList';

const useCarrierJobsOverview = () => {
  const { counters, loading, error } = useCarrierJobsList();

  return {
    counters,
    loading,
    error,
  };
};

export default useCarrierJobsOverview;