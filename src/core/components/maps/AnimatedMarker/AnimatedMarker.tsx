import React, { ReactNode, useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import MapView, { Marker, AnimatedRegion } from 'react-native-maps';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type Props = {
  newCoordinate: Coordinate;
  children?: ReactNode;
  duration?: number;
};

const screen = Dimensions.get('window');
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const AnimatedMarker = ({
  newCoordinate,
  children,
  duration = 1000,
}: Props) => {
  const coordinate = useRef(
    new AnimatedRegion({
      latitude: newCoordinate.latitude,
      longitude: newCoordinate.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    })
  ).current;

  useEffect(() => {
    if (!newCoordinate) return;

    coordinate
      .timing({
        latitude: newCoordinate.latitude,
        longitude: newCoordinate.longitude,
        duration,
        useNativeDriver: false,
      } as any)
      .start();
  }, [newCoordinate?.latitude, newCoordinate?.longitude, duration]);

  return (
    <Marker.Animated coordinate={coordinate as any}>
      {children}
    </Marker.Animated>
  );
};

export default AnimatedMarker;