import { useMemo } from 'react';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';
import useCarrierInspectionVehicles from '../../../modules/inspections/hooks/useCarrierInspectionVehicles';

type InspectionOverviewCounts = {
  pending: number;
  review: number;
  approved: number;
};

const APPROVED_STATUSES = ['approved_for_operation'];
const REVIEW_STATUSES = [
  'driver_submitted',
  'under_review',
  'resolved',
  'blocked_for_operation',
];

const initialCounts: InspectionOverviewCounts = {
  pending: 0,
  review: 0,
  approved: 0,
};

const useCarrierInspectionsOverview = () => {
  const currentUser = useCurrentUser();

  const vendorID =
    currentUser?.activeVendorID || currentUser?.vendorID || null;

  const { vehicles, loading } = useCarrierInspectionVehicles(vendorID);

  const counts = useMemo<InspectionOverviewCounts>(() => {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return initialCounts;
    }

    let approved = 0;
    let review = 0;
    let pending = 0;

    vehicles.forEach((item: any) => {
      const statusReport = item?.inspectionSummary?.statusReport || null;

      if (APPROVED_STATUSES.includes(statusReport)) {
        approved += 1;
        return;
      }

      if (REVIEW_STATUSES.includes(statusReport)) {
        review += 1;
        return;
      }

      pending += 1;
    });

    return {
      pending,
      review,
      approved,
    };
  }, [vehicles]);

  return {
    counts,
    loading,
  };
};

export default useCarrierInspectionsOverview;