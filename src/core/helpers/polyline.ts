import { decode } from '@liberty-rider/flexpolyline';

export const decodePolyline = (encoded: string) => {
  const decoded = decode(encoded);

  return {
    coords: decoded.polyline.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    })),
  };
};