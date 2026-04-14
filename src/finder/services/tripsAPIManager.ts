import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  increment,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { getUnixTimeStamp } from '../../core/helpers/timeFormat';

const tripRef = collection(db, 'taxi_trips');
const carCategoriesRef = collection(db, 'master_categories');
const usersRef = collection(db, 'users');

const createTrip = async (trip: any) => {
  try {
    const timestamp = getUnixTimeStamp();
    const data = { ...trip, createdAt: timestamp, updatedAt: timestamp };

    const tripDocRef = doc(tripRef);
    const tripId = tripDocRef.id;

    await setDoc(tripDocRef, { ...data, id: tripId }, { merge: true });

    if (trip?.passenger?.id) {
      const userDocRef = doc(db, 'users', trip.passenger.id);
      await updateDoc(userDocRef, {
        inProgressOrderID: tripId,
      });
    }

    return tripId;
  } catch (error) {
    console.error('Error creating trip:', error);
    return undefined;
  }
};

const updateTrip = async (tripId: string, trip: any) => {
  try {
    if (!tripId || !trip) return undefined;

    const tripDocRef = doc(db, 'taxi_trips', tripId);
    await setDoc(tripDocRef, trip, { merge: true });

    return tripId;
  } catch (error) {
    console.error('Error updating trip:', error);
    return undefined;
  }
};

const cancelTrip = async (trip: any) => {
  try {
    if (trip?.id) {
      await updateTrip(trip.id, { status: 'passenger_cancelled' });
    }

    if (trip?.driver?.id) {
      const driverRef = doc(db, 'users', trip.driver.id);
      await setDoc(
        driverRef,
        {
          inProgressOrderID: null,
          orderRequestData: null,
        },
        { merge: true }
      );
    }

    if (trip?.passenger?.id) {
      const passengerRef = doc(db, 'users', trip.passenger.id);
      await setDoc(
        passengerRef,
        {
          inProgressOrderID: null,
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Error cancelling trip:', error);
  }
};

const getTrip = async (tripId: string) => {
  try {
    if (!tripId) return undefined;

    const tripDocRef = doc(db, 'taxi_trips', tripId);
    const snapshot = await getDoc(tripDocRef);

    return snapshot.exists() ? snapshot.data() : undefined;
  } catch (error) {
    console.error('Error getting trip:', error);
    return undefined;
  }
};
const getCarCategories = async () => {
  try {
    const snapshots = await getDocs(carCategoriesRef);
    return snapshots.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  } catch (error) {
    console.error('Error fetching car categories:', error);
    throw error;
  }
};

const setCarCategories = async (carCategoryId: string, category: any) => {
  const categoryRef = doc(db, 'master_categories', carCategoryId);
  await setDoc(categoryRef, category);
  return carCategoryId;
};

const subscribeTrip = (
  tripId: string,
  callback: (trip: any) => void
) => {
  if (!tripId) return undefined;

  const tripDocRef = doc(db, 'taxi_trips', tripId);

  return onSnapshot(tripDocRef, (snapshot) => {
    callback(snapshot.data());
  });
};

const subscribeTripHistory = (
  userId: string,
  callback: (data: any[]) => void
) => {
  if (!userId) return undefined;

  const q = query(
    tripRef,
    where('passenger.id', '==', userId),
    where('status', '==', 'trip_completed')
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((docItem) => docItem.data());
    data.sort((a: any, b: any) => (b.tripEndTime ?? 0) - (a.tripEndTime ?? 0));
    callback(data);
  });
};

const subscribeCars = (callback: (cars: any[]) => void) => {
  const q = query(
    usersRef,
    where('role', '==', 'driver'),
    where('inProgressOrderID', '==', null)
  );

  return onSnapshot(q, (snapshot) => {
    const cars = snapshot.docs.map((docItem) => {
      const data = docItem.data();
      const driverLocation = data?.location;
      return {
        ...driverLocation,
        carType: data?.carType,
      };
    });

    callback(cars);
  });
};

const rateDriver = async (driverId: string, newRating: number) => {
  const driverRef = doc(db, 'users', driverId);
  const snapshot = await getDoc(driverRef);
  const user = snapshot.data();

  const ratings = user?.ratings ?? 0;
  const ratingsCount = user?.ratingsCount ?? 0;
  const totalNRatings = ratingsCount + 1;
  const ratingsSum = Math.floor(ratings * ratingsCount) + newRating;
  const calculatedRatings = ratingsSum / totalNRatings;

  await updateDoc(driverRef, {
    ratingsCount: increment(1),
    ratings: Number(calculatedRatings.toFixed(2)),
  });
};

export const tripsAPIManager = {
  createTrip,
  updateTrip,
  getTrip,
  subscribeTrip,
  subscribeTripHistory,
  getCarCategories,
  setCarCategories,
  subscribeCars,
  rateDriver,
  cancelTrip,
};

export default tripsAPIManager;