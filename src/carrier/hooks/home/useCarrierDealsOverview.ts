import useDashboardOffersSummary from '../../hooks/useDashboardOffersSummary';

const useCarrierDealsOverview = () => {
  const { counts, loading } = useDashboardOffersSummary();

  return {
    counts,
    loading,
  };
};

export default useCarrierDealsOverview;