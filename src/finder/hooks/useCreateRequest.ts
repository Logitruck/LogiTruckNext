import {
  auth,
  db,
  FieldValue,
} from '../../core/firebase/config';
import {
  doc,
  getDoc,
  collection,
  addDoc,
} from 'firebase/firestore';

type RequestRouteItem = {
  id: string;
  origin: any;
  destination: any;
  rideType: any;
  cargo: any;
  routeSummary: any;
  dieselPrice?: number | null;
  costEstimate?: any;
  vendors?: any[];
};

type CreateRequestParams = {
  routes: RequestRouteItem[];
  totalRoutes?: number;
  totalTrips?: number;
  averageDieselPrice?: number | null;
  suggestedPriceRange?: {
    min: number;
    max: number;
  };
};

const normalizeLocation = (location: any) => ({
  ...location,
  lat: location?.lat ?? location?.latitude ?? null,
  lon: location?.lon ?? location?.longitude ?? null,
  title: location?.title ?? location?.location ?? '',
});

const normalizeRideType = (rideType: any) => ({
  id: rideType?.id ?? null,
  title: rideType?.title ?? '',
  description: rideType?.description ?? '',
  photo: rideType?.photo ?? '',
  service: rideType?.service ?? '',
  ...rideType,
});

export default function useCreateRequest() {
  const createRequest = async ({
    routes,
    totalRoutes,
    totalTrips,
    averageDieselPrice,
    suggestedPriceRange,
  }: CreateRequestParams) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user");
      }

      if (!routes || !Array.isArray(routes) || routes.length === 0) {
        throw new Error("At least one route is required");
      }
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      const docData = userDoc.data();
      const finderID = docData?.activeVendorID || docData?.vendorID;

      if (!finderID) {
        throw new Error("Finder vendorID is required");
      }

      const createdBy = {
        userID: user.uid,
        email: user.email ?? docData?.email ?? "",
        displayName:
          user.displayName ??
          `${docData?.firstName ?? ""} ${docData?.lastName ?? ""}`.trim(),
        firstName: docData?.firstName ?? "",
        lastName: docData?.lastName ?? "",
      };

      const preparedRoutes = routes.map((route) => ({
        id: route.id,
        origin: normalizeLocation(route.origin),
        destination: normalizeLocation(route.destination),
        rideType: normalizeRideType(route.rideType),
        cargo: route.cargo ?? null,
        routeSummary: route.routeSummary ?? null,
        dieselPrice: route.dieselPrice ?? null,
        costEstimate: route.costEstimate ?? null,
        vendors: route.vendors ?? [],
      }));

      const computedTotalRoutes = totalRoutes ?? preparedRoutes.length;

      const computedTotalTrips =
        totalTrips ??
        preparedRoutes.reduce((sum, route) => {
          return sum + Number(route?.cargo?.trips || 0);
        }, 0);

      const requestPayload = {
        finderID,
        createdBy: {
          ...createdBy,
          vendorID: finderID,
        },

        routes: preparedRoutes,
        totalRoutes: computedTotalRoutes,
        totalTrips: computedTotalTrips,

        averageDieselPrice: averageDieselPrice ?? null,
        suggestedPriceRange: suggestedPriceRange ?? {
          min: 0,
          max: 0,
        },

        status: "sending",
        contract_status: "draft",

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const requestsRef = collection(db, 'requests');
      const docRef = await addDoc(requestsRef, requestPayload);

      return {
        success: true,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating request:', error);
      return {
        success: false,
        error,
      };
    }
  };

  return { createRequest };
}