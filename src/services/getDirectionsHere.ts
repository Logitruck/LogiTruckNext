import { decodePolyline } from '../core/helpers/polyline';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type HereRouteCoords = Array<{
  latitude: number;
  longitude: number;
}>;

export type HereRouteSummary = {
  length?: number;
  duration?: number;
  baseDuration?: number;
} | null;

export type HereDirectionsResult = {
  coords: HereRouteCoords;
  summary: HereRouteSummary;
  tolls: any[];
  polyline: string | null;
  raw: any;
} | null;

const hasValidCoordinates = (point?: LatLng | null) => {
  return (
    typeof point?.latitude === 'number' &&
    typeof point?.longitude === 'number'
  );
};

export const getDirectionsHere = async (
  startLoc: LatLng,
  destinationLoc: LatLng,
  apiKeyHere: string,
): Promise<HereDirectionsResult> => {
  if (!hasValidCoordinates(startLoc) || !hasValidCoordinates(destinationLoc)) {
    console.log('Error in getDirectionsHere: invalid coordinates');
    return null;
  }

  if (!apiKeyHere) {
    console.log('Error in getDirectionsHere: missing HERE api key');
    return null;
  }

  const hereApiEndpoint =
    `https://router.hereapi.com/v8/routes` +
    `?transportMode=truck` +
    `&origin=${startLoc.latitude},${startLoc.longitude}` +
    `&destination=${destinationLoc.latitude},${destinationLoc.longitude}` +
    `&return=polyline,summary,travelSummary,tolls` +
    `&apikey=${apiKeyHere}`;

  try {
    const resp = await fetch(hereApiEndpoint);
    const data = await resp.json();

    const section = data?.routes?.[0]?.sections?.[0];
    if (!section) {
      return null;
    }

    const summary = section?.summary ?? null;
    const dataPolyline = section?.polyline ?? null;
    const tolls = section?.tolls ?? [];

    let coords: HereRouteCoords = [];

    if (dataPolyline) {
      const decoded = decodePolyline(dataPolyline);
      coords = decoded?.coords ?? [];
    }

    return {
      coords,
      summary,
      tolls,
      polyline: dataPolyline,
      raw: data,
    };
  } catch (error) {
    console.log('Error in getDirectionsHere:', error);
    return null;
  }
};

export default getDirectionsHere;