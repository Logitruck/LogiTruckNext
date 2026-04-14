import { useMemo } from 'react';

import useCarrierInspectionsOverview from './useCarrierInspectionsOverview';
import useLiveTruckLocations from '../../hooks/useLiveTruckLocations';
import useDashboardOffersSummary from '../../hooks/useDashboardOffersSummary';

type PrioritySeverity = 'low' | 'medium' | 'high';

export type PriorityActionItem = {
  id: string;
  label: string;
  count: number;
  severity: PrioritySeverity;
  icon: string;
  target?: {
    routeName: string;
    params?: any;
  };
};

const getSeverity = (count: number): PrioritySeverity => {
  if (count >= 5) return 'high';
  if (count >= 1) return 'medium';
  return 'low';
};

const useCarrierPriorityActions = () => {
  const {
    truckLocations = [],
    loading: liveLoading,
  } = useLiveTruckLocations();

  const {
    counts: inspectionCounts,
    loading: inspectionsLoading,
  } = useCarrierInspectionsOverview();

  const {
    counts: offerCounts,
    loading: offersLoading,
  } = useDashboardOffersSummary();

  const activeTripsCount = useMemo(() => {
    return truckLocations.filter(
      (item: any) =>
        item?.tripStatus === 'in_progress' ||
        item?.tripStatus === 'en_route' ||
        item?.tripStatus === 'en_route_to_dropoff' ||
        item?.tripStatus === 'heading_to_pickup' ||
        item?.tripStatus === 'arrived_at_pickup' ||
        item?.currentJobID,
    ).length;
  }, [truckLocations]);

const inspectionsPendingCount = useMemo(() => {
  return inspectionCounts.review || 0;
}, [inspectionCounts]);

  const offersPendingReviewCount = useMemo(() => {
    return offerCounts.ready || 0;
  }, [offerCounts]);

  const contractsToSignCount = useMemo(() => {
    return offerCounts.to_sign || 0;
  }, [offerCounts]);

  const actions: PriorityActionItem[] = useMemo(() => {
    const base: PriorityActionItem[] = [
      {
        id: 'trips_active',
        label: 'Trips in execution',
        count: activeTripsCount,
        severity: getSeverity(activeTripsCount),
        icon: 'truck-fast-outline',
        target: {
          routeName: 'CarrierTruckLiveTab',
          params: {
            initialFilter: 'active',
          },
        },
      },
      {
        id: 'inspections_pending',
        label: 'Inspections pending review',
        count: inspectionsPendingCount,
        severity: getSeverity(inspectionsPendingCount),
        icon: 'clipboard-alert-outline',
        target: {
          routeName: 'CarrierInspectionsTab',
          params: {
            status: 'pending',
          },
        },
      },
      {
        id: 'offers_review',
        label: 'Offers waiting review',
        count: offersPendingReviewCount,
        severity: getSeverity(offersPendingReviewCount),
        icon: 'file-document-edit-outline',
        target: {
          routeName: 'CarrierDealsTab',
          params: {
            screen: 'Offers',
            params: {
              screen: 'OffersHome',
              params: { status: 'ready' },
            },
          },
        },
      },
      {
        id: 'contracts_sign',
        label: 'Contracts to sign',
        count: contractsToSignCount,
        severity: getSeverity(contractsToSignCount),
        icon: 'draw-pen',
        target: {
          routeName: 'CarrierDealsTab',
          params: {
            screen: 'Offers',
            params: {
              screen: 'OffersHome',
              params: { status: 'to_sign' },
            },
          },
        },
      },
    ];

    return base
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [
    activeTripsCount,
    inspectionsPendingCount,
    offersPendingReviewCount,
    contractsToSignCount,
  ]);

  return {
    actions,
    loading: liveLoading || inspectionsLoading || offersLoading,
  };
};

export default useCarrierPriorityActions;