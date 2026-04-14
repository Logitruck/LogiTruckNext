import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type RouteOfferItem = {
  routeID: string;
  pricePerTrip: number;
  tripsOffered: number;
  notes?: string;
};

type SubmitOfferParams = {
  requestID: string;
  matchedRoutes: any[];
  matchedRoutesCount: number;
  totalTrips: number;
  totalPrice: number;
  estimatedDays: number;
  availableTrucks: number;
  estimatedStartDate: Date | null;
  comment?: string;
  routeOffers: RouteOfferItem[];
};

const useSubmitVendorOffer = () => {
  const currentUser = useCurrentUser();
  const vendorID = currentUser?.vendorID;

  return async ({
    requestID,
    matchedRoutes,
    matchedRoutesCount,
    totalTrips,
    totalPrice,
    estimatedDays,
    availableTrucks,
    estimatedStartDate,
    comment = '',
    routeOffers,
  }: SubmitOfferParams) => {
    try {
      if (!vendorID || !requestID) {
        throw new Error('Missing vendor or request ID');
      }

      if (!Array.isArray(routeOffers) || routeOffers.length === 0) {
        throw new Error('At least one prepared route is required');
      }

      if (
        Number.isNaN(totalPrice) ||
        Number.isNaN(totalTrips) ||
        Number.isNaN(estimatedDays) ||
        Number.isNaN(availableTrucks)
      ) {
        throw new Error('Invalid numeric values');
      }

      const hasInvalidRouteOffers = routeOffers.some((routeOffer) => {
        return (
          !routeOffer?.routeID ||
          Number.isNaN(Number(routeOffer?.pricePerTrip)) ||
          Number(routeOffer?.pricePerTrip) <= 0 ||
          Number.isNaN(Number(routeOffer?.tripsOffered)) ||
          Number(routeOffer?.tripsOffered) <= 0
        );
      });

      if (hasInvalidRouteOffers) {
        throw new Error('One or more route offers are invalid');
      }

      const vendorRequestRef = doc(
        db,
        'vendor_requests',
        vendorID,
        'requests',
        requestID,
      );

      const offerPayload = {
        vendorID,
        status: 'offered',
        matchedRoutes: matchedRoutes ?? [],
        matchedRoutesCount: matchedRoutesCount ?? 0,
        offer: {
          totalPrice: Number(totalPrice) || 0,
          totalTrips: Number(totalTrips) || 0,
          estimatedDays: Number(estimatedDays) || 0,
          availableTrucks: Number(availableTrucks) || 0,
          estimatedStartDate: estimatedStartDate ?? null,
          comment: comment ?? '',
          routeOffers: routeOffers.map((routeOffer) => ({
            routeID: routeOffer.routeID,
            pricePerTrip: Number(routeOffer.pricePerTrip) || 0,
            tripsOffered: Number(routeOffer.tripsOffered) || 0,
            notes: routeOffer.notes ?? '',
          })),
          createdAt: serverTimestamp(),
          submittedBy: {
            uid: currentUser?.id ?? currentUser?.userID ?? '',
            email: currentUser?.email ?? '',
            displayName:
              currentUser?.displayName ??
              `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim(),
          },
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(vendorRequestRef, offerPayload, { merge: true });

      console.log('✅ Multiroute vendor offer submitted successfully');
      return true;
    } catch (error) {
      console.error('🔥 Error submitting vendor offer:', error);
      throw error;
    }
  };
};

export default useSubmitVendorOffer;