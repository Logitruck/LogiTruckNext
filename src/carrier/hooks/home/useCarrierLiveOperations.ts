import { useMemo } from 'react';

import useLiveTruckLocations from '../../hooks/useLiveTruckLocations';

const isActiveTripStatus = (status?: string | null) => {
  return (
    status === 'in_progress' ||
    status === 'en_route' ||
    status === 'en_route_to_dropoff' ||
    status === 'heading_to_pickup' ||
    status === 'arrived_at_pickup' ||
    status === 'arrived_at_dropoff'
  );
};

const isDelayedTripStatus = (status?: string | null) => {
  return status === 'delayed';
};

const useCarrierLiveOperations = () => {
  const {
    truckLocations = [],
    loading,
    error,
  } = useLiveTruckLocations();

  const activeTrips = useMemo(() => {
    return truckLocations.filter(
      (item: any) =>
        isActiveTripStatus(item?.tripStatus) || !!item?.currentJobID,
    );
  }, [truckLocations]);

  const delayedTrips = useMemo(() => {
    return truckLocations.filter(
      (item: any) =>
        isDelayedTripStatus(item?.tripStatus) ||
        item?.statusCategory === 'delayed',
    );
  }, [truckLocations]);

  const summary = useMemo(() => {
    return {
      active: activeTrips.length,
      delayed: delayedTrips.length,
    };
  }, [activeTrips, delayedTrips]);

  return {
    trucks: activeTrips,
    summary,
    loading,
    error,
  };
};

export default useCarrierLiveOperations;