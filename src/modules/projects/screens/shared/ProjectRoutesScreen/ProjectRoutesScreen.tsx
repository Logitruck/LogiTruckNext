import React, { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useProjectDetails from '../../../hooks/shared/useProjectDetails';
import { decode } from '@liberty-rider/flexpolyline';

type Props = {
  route: any;
  navigation: any;
};

const { width } = Dimensions.get('window');

const formatDate = (value?: string) => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toDateString();
};

const normalizeCoords = (coords: any[] = []) =>
  coords
    .map((point) => ({
      latitude: point?.latitude ?? point?.lat,
      longitude: point?.longitude ?? point?.lng ?? point?.longitude,
    }))
    .filter(
      (point) =>
        typeof point.latitude === 'number' &&
        typeof point.longitude === 'number',
    );

const getRouteCoordinates = (routeItem: any) => {
  if (Array.isArray(routeItem?.routeCoordinates)) {
    return normalizeCoords(routeItem.routeCoordinates);
  }

  if (routeItem?.encodedPolyline) {
    try {
      const decoded = decode(routeItem.encodedPolyline)?.polyline || [];
      return decoded.map((point: any) => ({
        latitude: point[0],
        longitude: point[1],
      }));
    } catch (error) {
      console.error('Error decoding polyline:', error);
    }
  }

  const originLat = routeItem?.origin?.latitude ?? routeItem?.origin?.lat;
  const originLng = routeItem?.origin?.longitude ?? routeItem?.origin?.lng;
  const destinationLat =
    routeItem?.destination?.latitude ?? routeItem?.destination?.lat;
  const destinationLng =
    routeItem?.destination?.longitude ?? routeItem?.destination?.lng;

  if (
    typeof originLat === 'number' &&
    typeof originLng === 'number' &&
    typeof destinationLat === 'number' &&
    typeof destinationLng === 'number'
  ) {
    return [
      { latitude: originLat, longitude: originLng },
      { latitude: destinationLat, longitude: destinationLng },
    ];
  }

  return [];
};

const ProjectRoutesScreen = ({ route, navigation }: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const mapRef = useRef<MapView | null>(null);

  const {
    project: initialProject,
    channelID: routeChannelID,
    projectID: routeProjectID,
  } = route.params || {};

  const channelID = routeChannelID || initialProject?.channelID;
  const projectID = routeProjectID || initialProject?.id;

  const { project, loading } = useProjectDetails(channelID, projectID);

  const routes = useMemo(
    () => (Array.isArray(project?.routes) ? project.routes : []),
    [project?.routes],
  );

  const routesWithCoordinates = useMemo(() => {
    return routes.map((item: any, index: number) => ({
      ...item,
      _index: index,
      coordinates: getRouteCoordinates(item),
    }));
  }, [routes]);

  const allCoordinates = useMemo(() => {
    return routesWithCoordinates.flatMap((item: any) => item.coordinates || []);
  }, [routesWithCoordinates]);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Project Routes'),
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, localized, theme, appearance]);

  useEffect(() => {
    if (!mapRef.current || allCoordinates.length === 0) return;

    const timeout = setTimeout(() => {
      mapRef.current?.fitToCoordinates(allCoordinates, {
        edgePadding: {
          top: 60,
          right: 40,
          bottom: 60,
          left: 40,
        },
        animated: true,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [allCoordinates]);

  const renderRouteCard = ({ item, index }: { item: any; index: number }) => {
    const trips = item?.tripsOffered ?? item?.cargo?.trips ?? 0;
    const startDate = formatDate(item?.cargo?.startDate);

    return (
      <View style={styles.routeCard}>
        <View style={styles.routeCardHeader}>
          <Text style={styles.routeTitle}>
            {localized('Route')} {index + 1}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {localized('Trips')}: {trips}
            </Text>
          </View>
        </View>

        <Text style={styles.routePath}>
          {item?.origin?.title || '-'} → {item?.destination?.title || '-'}
        </Text>

        <Text style={styles.routeMeta}>
          {localized('Pickup Alias')}: {item?.pickupAlias || '-'}
        </Text>

        <Text style={styles.routeMeta}>
          {localized('Dropoff Alias')}: {item?.dropoffAlias || '-'}
        </Text>

        <Text style={styles.routeMeta}>
          {localized('Start Date')}: {startDate}
        </Text>
      </View>
    );
  };

  if (loading || !project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={routesWithCoordinates}
        keyExtractor={(item, index) => item?.id || `route-${index}`}
        renderItem={renderRouteCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.mapContainer}>
              {allCoordinates.length > 0 ? (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: allCoordinates[0]?.latitude || 25.7617,
                    longitude: allCoordinates[0]?.longitude || -80.1918,
                    latitudeDelta: 2,
                    longitudeDelta: 2,
                  }}
                >
                  {routesWithCoordinates.map((routeItem: any, index: number) => {
                    const coordinates = routeItem.coordinates || [];
                    const firstPoint = coordinates[0];
                    const lastPoint = coordinates[coordinates.length - 1];

                    return (
                      <React.Fragment key={routeItem?.id || index}>
                        {coordinates.length > 1 ? (
                          <Polyline
                            coordinates={coordinates}
                            strokeWidth={4}
                          />
                        ) : null}

                        {firstPoint ? (
                          <Marker coordinate={firstPoint}>
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={28}
                              color={theme.colors[appearance].primaryForeground}
                            />
                          </Marker>
                        ) : null}

                        {lastPoint ? (
                          <Marker coordinate={lastPoint}>
                            <MaterialCommunityIcons
                              name="flag-checkered"
                              size={24}
                              color={theme.colors[appearance].danger}
                            />
                          </Marker>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </MapView>
              ) : (
                <View style={styles.emptyMap}>
                  <MaterialCommunityIcons
                    name="map-marker-off-outline"
                    size={40}
                    color={theme.colors[appearance].secondaryText}
                  />
                  <Text style={styles.emptyMapText}>
                    {localized('No route map available')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.projectName}>
                {project?.name || project?.title || localized('Untitled Project')}
              </Text>
              <Text style={styles.summaryText}>
                {localized('Total Routes')}: {routes.length}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {localized('No routes available')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ProjectRoutesScreen;