import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { decode } from '@liberty-rider/flexpolyline';

type Props = {
  encodedPolyline?: string;
  height?: number;
  showMarkers?: boolean;
};

const RouteMap = ({
  encodedPolyline,
  height = 220,
  showMarkers = true,
}: Props) => {
  const mapRef = useRef<MapView | null>(null);

  // 🔹 Decode polyline
  const coordinates = useMemo(() => {
    if (!encodedPolyline) return [];

    try {
const decoded = decode(encodedPolyline);

return decoded.polyline.map(([lat, lng]) => ({
  latitude: lat,
  longitude: lng,
}));
    } catch (error) {
      console.warn('[RouteMap] decode error:', error);
      return [];
    }
  }, [encodedPolyline]);

  const origin = coordinates[0];
  const destination = coordinates[coordinates.length - 1];

  // 🔹 Fit map to route
  useEffect(() => {
    if (mapRef.current && coordinates.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 80,
            right: 40,
            bottom: 80,
            left: 40,
          },
          animated: true,
        });
      }, 400);
    }
  }, [coordinates]);

  if (!coordinates.length) {
    return <View style={[styles.container, { height }]} />;
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: origin?.latitude || 0,
          longitude: origin?.longitude || 0,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {/* 🔵 Route */}
        <Polyline
          coordinates={coordinates}
          strokeWidth={4}
          strokeColor="#2563eb"
        />

        {/* 🟢 Origin */}
        {showMarkers && origin && (
          <Marker coordinate={origin} title="Origin" pinColor="green" />
        )}

        {/* 🔴 Destination */}
        {showMarkers && destination && (
          <Marker coordinate={destination} title="Destination" pinColor="red" />
        )}
      </MapView>
    </View>
  );
};

export default RouteMap;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 12,
  },
});