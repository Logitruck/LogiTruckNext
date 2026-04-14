import { useEffect, useState } from 'react';
import { useConfig } from '../../config';
import { getDirectionsHere, LatLng } from '../../services/getDirectionsHere';

type Destination = {
  lat: number;
  lon: number;
};

type RouteSummary = {
  distanceMiles: number;
  durationMinutes: number;
} | null;

type UseRouteToDestinationParams = {
  from?: LatLng | null;
  to?: Destination | null;
};

type UseRouteToDestinationReturn = {
  coords: LatLng[];
  summary: RouteSummary;
  loading: boolean;
};

const useRouteToDestination = ({
  from,
  to,
}: UseRouteToDestinationParams): UseRouteToDestinationReturn => {
  const [coords, setCoords] = useState<LatLng[]>([]);
  const [summary, setSummary] = useState<RouteSummary>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const config = useConfig();
  const apiKey = config?.hereAPIKey;

  useEffect(() => {
    const hasOrigin =
      typeof from?.latitude === 'number' &&
      typeof from?.longitude === 'number';

    const hasDestination =
      typeof to?.lat === 'number' &&
      typeof to?.lon === 'number';

    if (!hasOrigin || !hasDestination || !apiKey) {
      setCoords([]);
      setSummary(null);
      return;
    }

    let mounted = true;

    const fetchRoute = async () => {
      setLoading(true);

      try {
        const result = await getDirectionsHere(
          {
            latitude: from!.latitude,
            longitude: from!.longitude,
          },
          {
            latitude: to!.lat,
            longitude: to!.lon,
          },
          apiKey,
        );

        if (!mounted) return;

        if (!result) {
          setCoords([]);
          setSummary(null);
          return;
        }

        setCoords(result.coords || []);

        if (result.summary) {
          setSummary({
            distanceMiles: +(
              (result.summary.length ?? 0) / 1609.34
            ).toFixed(2),
            durationMinutes: Math.round(
              (result.summary.duration ?? 0) / 60,
            ),
          });
        } else {
          setSummary(null);
        }
      } catch (error) {
        console.error('❌ Error fetching destination route:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRoute();

    return () => {
      mounted = false;
    };
  }, [
    from?.latitude,
    from?.longitude,
    to?.lat,
    to?.lon,
    apiKey,
  ]);

  return { coords, summary, loading };
};

export default useRouteToDestination;