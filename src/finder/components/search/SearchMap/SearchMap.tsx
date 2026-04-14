import React, { useEffect, useRef } from 'react';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useSelector } from 'react-redux';
import MapViewBase from '../../../../core/components/maps/MapViewBase';
import useFinderRoute from '../../../hooks/useFinderRoute';
import { Dimensions } from 'react-native';

type Props = {
  onMapReady?: () => void;
};

const DEFAULT_REGION: Region = {
  latitude: 25.7617,
  longitude: -80.1918,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const SearchMap = ({ onMapReady }: Props) => {
  const mapRef = useRef<MapView | null>(null);

  const origin = useSelector((state: any) => state.trip?.origin);
  const destination = useSelector((state: any) => state.trip?.destination);

  const { coordinates } = useFinderRoute();
const screenHeight = Dimensions.get('window').height;

const bottomSheetHeight = screenHeight * 0.45;
useEffect(() => {
  if (coordinates.length > 0 && mapRef.current) {
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 120,
          right: 40,
          bottom: bottomSheetHeight,
          left: 40,
        },
        animated: true,
      });
    }, 400);
  }
}, [coordinates]);

  return (
    <MapViewBase
      ref={mapRef}
      onMapReady={onMapReady}
      initialRegion={{
        latitude: origin?.latitude || DEFAULT_REGION.latitude,
        longitude: origin?.longitude || DEFAULT_REGION.longitude,
        latitudeDelta: DEFAULT_REGION.latitudeDelta,
        longitudeDelta: DEFAULT_REGION.longitudeDelta,
      }}
      showsUserLocation
      loadingEnabled
    >
      {origin?.latitude && origin?.longitude && (
        <Marker
          coordinate={{
            latitude: origin.latitude,
            longitude: origin.longitude,
          }}
          title="Origin"
        />
      )}

      {destination?.latitude && destination?.longitude && (
        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title="Destination"
        />
      )}

      {coordinates.length > 0 && (
        <Polyline
          coordinates={coordinates}
          strokeWidth={4}
          strokeColor="#007AFF"
        />
      )}
    </MapViewBase>
  );
};

export default SearchMap;