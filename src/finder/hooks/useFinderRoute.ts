import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useConfig } from '../../config';
import {
  setSummaryTrip,
  setQuoteCoordinates,
  setDropoffETA,
  setDropoffDistance,
} from '../../redux';
import { getDirectionsHere } from '../services/directions';

type Coordinate = {
  latitude: number;
  longitude: number;
};

const convertSecondsToHoursAndMinutes = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return { hours, minutes };
};

const convertMetersToMiles = (meters: number) => {
  return parseFloat((meters / 1609.34).toFixed(2));
};

const computeFuelCharge = (
  miles: number,
  pricePerGallon: number,
  vehicleMpg: number
) => {
  return parseFloat(((miles / vehicleMpg) * pricePerGallon).toFixed(2));
};

const useFinderRoute = () => {
  const dispatch = useDispatch();
  const config = useConfig();

  const origin = useSelector((state: any) => state.trip?.origin);
  const destination = useSelector((state: any) => state.trip?.destination);
  const rideCategories = useSelector((state: any) => state.ride?.carCategories ?? []);

  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [summaryTrip, setLocalSummaryTrip] = useState<any | null>(null);
  const [pointsTolls, setPointsTolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const hasRoute = useMemo(() => {
    return Boolean(
      origin?.latitude &&
        origin?.longitude &&
        destination?.latitude &&
        destination?.longitude
    );
  }, [origin, destination]);

  useEffect(() => {
    const run = async () => {
      if (!hasRoute) {
        setCoordinates([]);
        setPointsTolls([]);
        setLocalSummaryTrip(null);
        return;
      }

      setLoading(true);

      try {
        const sourceCoordinate = {
          latitude: origin.latitude,
          longitude: origin.longitude,
        };

        const destCoordinate = {
          latitude: destination.latitude,
          longitude: destination.longitude,
        };

        const response = await getDirectionsHere(
          sourceCoordinate,
          destCoordinate,
          config.hereAPIKey
        );

        if (!response) {
          setCoordinates([]);
          setPointsTolls([]);
          setLocalSummaryTrip(null);
          return;
        }

        const { coords, summary, tolls, polyline } = response;

        const enrichedSummary = { ...(summary ?? {}) };

        const durationSeconds = enrichedSummary?.duration ?? 0;
        const distanceMeters = enrichedSummary?.length ?? 0;

        const { hours, minutes } = convertSecondsToHoursAndMinutes(durationSeconds);
        const miles = convertMetersToMiles(distanceMeters);

        enrichedSummary.durationHour = hours;
        enrichedSummary.durationMinutes = minutes;
        enrichedSummary.durationTotal = `${hours}h:${minutes}min`;
        enrichedSummary.lengthMiles = miles;
        enrichedSummary.totalTolls = Array.isArray(tolls) ? tolls.length : 0;

        const pricePerGallon = 3.5;
        const vehicleMpg = 6;
        enrichedSummary.fuelCharge = computeFuelCharge(
          miles,
          pricePerGallon,
          vehicleMpg
        );

        // Placeholder para futura lógica de pricing por categoría
        // Cuando migres el cálculo real, aquí lo conectas.
        if (rideCategories?.length) {
          enrichedSummary.availableCategories = rideCategories.length;
        }

        setCoordinates(coords ?? []);
        setPointsTolls(tolls ?? []);
        setLocalSummaryTrip(enrichedSummary);

        dispatch(setSummaryTrip(enrichedSummary));
        dispatch(setQuoteCoordinates(polyline ?? null));
        dispatch(setDropoffETA(durationSeconds));
        dispatch(setDropoffDistance(distanceMeters));
      } catch (error) {
        console.log('Error in useFinderRoute:', error);
        setCoordinates([]);
        setPointsTolls([]);
        setLocalSummaryTrip(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [
    hasRoute,
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    config.hereAPIKey,
    dispatch,
    rideCategories,
  ]);

  return {
    coordinates,
    summaryTrip,
    pointsTolls,
    loading,
    hasRoute,
  };
};

export default useFinderRoute;