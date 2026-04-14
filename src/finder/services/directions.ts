import Polyline from '@mapbox/polyline';
import { decodePolyline } from '../../core/helpers/polyline';

export const getDirections = async (
  startLoc: { latitude: number; longitude: number },
  destinationLoc: { latitude: number; longitude: number },
  apiKey: string
) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc.latitude},${startLoc.longitude}&destination=${destinationLoc.latitude},${destinationLoc.longitude}&key=${apiKey}`;

    const resp = await fetch(url);
    const respJson = await resp.json();

    const encoded = respJson.routes?.[0]?.overview_polyline?.points;
    if (!encoded) return null;

 const points = Polyline.decode(encoded) as [number, number][];

const coords = points.map(([lat, lng]) => ({
  latitude: lat,
  longitude: lng,
}));

    return coords;
  } catch (error) {
    console.log('Error in getDirections:', error);
    return null;
  }
};

export const getETA = async (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  apiKey: string
) => {
  const etaRequestURL =
    `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${start.latitude},${start.longitude}&destinations=${end.latitude}%2C${end.longitude}&key=` +
    apiKey;

  try {
    const matrix = await fetch(etaRequestURL, { method: 'GET' });
    const matrixJson = await matrix.json();

    const rows = matrixJson.rows;
    if (!rows || rows.length < 1) return null;

    const elements = rows[0].elements;
    if (!elements || elements.length < 1) return null;

    return elements[0]?.duration?.value ?? null;
  } catch (error) {
    console.log('Error in getETA:', error);
    return null;
  }
};

export const getDirectionsHere = async (
  startLoc: { latitude: number; longitude: number },
  destinationLoc: { latitude: number; longitude: number },
  apiKeyHere: string
) => {
  const hereApiEndpoint = `https://router.hereapi.com/v8/routes?transportMode=truck&origin=${startLoc.latitude},${startLoc.longitude}&destination=${destinationLoc.latitude},${destinationLoc.longitude}&return=polyline,summary,travelSummary,tolls&apikey=${apiKeyHere}`;

  try {
    const resp = await fetch(hereApiEndpoint);
    const data = await resp.json();

    const section = data?.routes?.[0]?.sections?.[0];
    if (!section) return null;

    const summary = section?.summary ?? null;
    const dataPolyline = section?.polyline ?? null;
    const tolls = section?.tolls ?? [];

    let coords: Array<{ latitude: number; longitude: number }> = [];

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