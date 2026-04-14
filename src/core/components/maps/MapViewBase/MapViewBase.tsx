import React, { forwardRef } from 'react';
import { View, ViewStyle } from 'react-native';
import MapView, { MapViewProps, Region } from 'react-native-maps';
import { dynamicStyles } from './MapViewBase.styles';

type Props = {
  initialRegion?: Region;
  children?: React.ReactNode;
  onMapReady?: () => void;
  style?: ViewStyle;
  mapStyle?: ViewStyle;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  loadingEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
} & Partial<MapViewProps>;

const DEFAULT_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapViewBase = forwardRef<MapView, Props>(
  (
    {
      initialRegion = DEFAULT_REGION,
      children,
      onMapReady,
      style,
      mapStyle,
      showsUserLocation = false,
      showsMyLocationButton = false,
      followsUserLocation = false,
      loadingEnabled = true,
      scrollEnabled = true,
      zoomEnabled = true,
      rotateEnabled = true,
      pitchEnabled = true,
      ...rest
    },
    ref
  ) => {
    const styles = dynamicStyles();

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={ref}
          style={[styles.map, mapStyle]}
          initialRegion={initialRegion}
          onMapReady={onMapReady}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={showsMyLocationButton}
          followsUserLocation={followsUserLocation}
          loadingEnabled={loadingEnabled}
          scrollEnabled={scrollEnabled}
          zoomEnabled={zoomEnabled}
          rotateEnabled={rotateEnabled}
          pitchEnabled={pitchEnabled}
          {...rest}
        >
          {children}
        </MapView>
      </View>
    );
  }
);

MapViewBase.displayName = 'MapViewBase';

export default MapViewBase;