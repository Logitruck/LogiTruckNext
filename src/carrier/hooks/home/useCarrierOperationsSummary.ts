import { useMemo } from 'react';

import useLiveTruckLocations from '../../hooks/useLiveTruckLocations';
import useDashboardOffersSummary from '../../hooks/useDashboardOffersSummary';

const useCarrierOperationsSummary = () => {
  const {
    truckLocations = [],
    loading: liveFleetLoading,
  } = useLiveTruckLocations();

  const { counts, loading: offersLoading } = useDashboardOffersSummary();

  const activeTripsCount = useMemo(() => {
    return truckLocations.filter(
      (item: any) =>
        item?.tripStatus === 'in_progress' ||
        item?.tripStatus === 'en_route' ||
        item?.tripStatus === 'en_route_to_dropoff' ||
        item?.tripStatus === 'heading_to_pickup' ||
        item?.currentJobID,
    ).length;
  }, [truckLocations]);

  const liveFleetCount = useMemo(() => {
    return truckLocations.length;
  }, [truckLocations]);

  const pendingInspectionsCount = 0;

  const offersInReviewCount = useMemo(() => {
    return counts.ready + counts.to_sign;
  }, [counts]);

  const loading = liveFleetLoading || offersLoading;

  return {
    activeTripsCount,
    liveFleetCount,
    pendingInspectionsCount,
    offersInReviewCount,
    loading,
  };
};

export default useCarrierOperationsSummary;