import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { functions } from '../../../../../core/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { decode } from '@liberty-rider/flexpolyline';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './ReviewRequestScreen.styles';
import useCreateRequest from '../../../../hooks/useCreateRequest';
import { clearRequestPackage, resetTripState } from '../../../../../redux';
import { formatCurrency } from '../../../../../utils/formatters';

const { height } = Dimensions.get('window');

type Coordinate = {
  latitude: number;
  longitude: number;
};

type EvaluatedRoute = {
  id: string;
  origin: any;
  destination: any;
  routeSummary?: any;
  cargo?: any;
  rideType?: any;
  vendors?: any[];
  dieselPrice?: number | null;
  costEstimate?: any;
  routeCoords?: Coordinate[];
};

const ReviewRequestScreen = ({ navigation }: { navigation: any }) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const requestRoutes = useSelector(
    (state: any) => state.finderRequestPackage?.routes || []
  );

  const [evaluatedRoutes, setEvaluatedRoutes] = useState<EvaluatedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const { createRequest } = useCreateRequest();
  const dispatch = useDispatch();
  const mapRef = useRef<MapView | null>(null);

  const decodePolyline = (polyline: string) => {
    const points = decode(polyline);
    const rawPoints = points?.polyline || points;

    return rawPoints.map(([lat, lon]: [number, number]) => ({
      latitude: parseFloat(String(lat)),
      longitude: parseFloat(String(lon)),
    }));
  };

  useEffect(() => {
    if (!requestRoutes.length) {
      navigation.goBack();
      return;
    }

    const fetchEvaluation = async () => {
      try {
        setLoading(true);

        const getFullTripEvaluation = httpsCallable(functions, 'triprequest');

        const results = await Promise.all(
          requestRoutes.map(async (route: any) => {
            if (
              !route?.origin?.latitude ||
              !route?.origin?.longitude ||
              !route?.destination?.latitude ||
              !route?.destination?.longitude ||
              !route?.rideType?.id
            ) {
              throw new Error(`Missing route data for ${route?.id || 'unknown route'}`);
            }

            const payload = {
              origin: {
                lat: route.origin.latitude,
                lon: route.origin.longitude,
                title: route.origin.title || 'Origin',
              },
              destination: {
                lat: route.destination.latitude,
                lon: route.destination.longitude,
                title: route.destination.title || 'Destination',
              },
              categoryID: route.rideType.id,
              keyword: '',
            };

            console.log('🚚 triprequest payload', payload);

            const response = await getFullTripEvaluation(payload);
            const data = (response.data ?? {}) as any;

            const routeSummary = data?.routeSummary ?? null;
            const dieselPrice = data?.dieselPriceUSD ?? null;
            const costEstimate = data?.estimatedTripCost ?? null;
            const vendors = data?.vendors ?? [];

            let routeCoords: Coordinate[] = [];
            if (routeSummary?.encodedPolyline) {
              routeCoords = decodePolyline(routeSummary.encodedPolyline);
            }

            return {
              ...route,
              routeSummary,
              dieselPrice,
              costEstimate,
              vendors,
              routeCoords,
            };
          })
        );

        setEvaluatedRoutes(results);

        setTimeout(() => {
          if (!mapRef.current) return;

          const allCoords: Coordinate[] = [];

          results.forEach((route) => {
            if (route.origin?.latitude && route.origin?.longitude) {
              allCoords.push({
                latitude: route.origin.latitude,
                longitude: route.origin.longitude,
              });
            }

            if (route.destination?.latitude && route.destination?.longitude) {
              allCoords.push({
                latitude: route.destination.latitude,
                longitude: route.destination.longitude,
              });
            }

            if (route.routeCoords?.length) {
              allCoords.push(...route.routeCoords);
            }

            (route.vendors || []).forEach((company: any) => {
              if (company?.lat && company?.lng) {
                allCoords.push({
                  latitude: company.lat,
                  longitude: company.lng,
                });
              }
            });
          });

          if (allCoords.length > 0) {
            mapRef.current.fitToCoordinates(allCoords, {
              edgePadding: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50,
              },
              animated: true,
            });
          }
        }, 500);
      } catch (error) {
        console.error('❌ Error fetching package evaluation:', error);
        Alert.alert(
          localized('Error'),
          localized('Could not load package evaluation.')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [requestRoutes, navigation, localized]);

  const totalRoutes = evaluatedRoutes.length;

  const totalTrips = evaluatedRoutes.reduce(
    (sum, route) => sum + (route?.cargo?.trips || 0),
    0
  );

const uniqueVendorsMap = new Map();

evaluatedRoutes.forEach((route) => {
  (route?.vendors || []).forEach((vendor: any) => {
    const vendorKey =
      vendor?.id ||
      vendor?.vendorID ||
      vendor?.vendorId ||
      vendor?.uid;

    if (vendorKey) {
      uniqueVendorsMap.set(vendorKey, vendor);
    }
  });
});

const totalVendors = uniqueVendorsMap.size;

  const minSuggestedPrice = evaluatedRoutes.reduce((sum, route) => {
    return sum + Number(route?.costEstimate?.precioMin || 0);
  }, 0);

  const maxSuggestedPrice = evaluatedRoutes.reduce((sum, route) => {
    return sum + Number(route?.costEstimate?.precioMax || 0);
  }, 0);

  const averageDieselPrice =
    evaluatedRoutes.length > 0
      ? evaluatedRoutes.reduce(
          (sum, route) => sum + Number(route?.dieselPrice || 0),
          0
        ) / evaluatedRoutes.length
      : null;

  const onSendRequest = async () => {
    const result = await createRequest({
      routes: evaluatedRoutes.map((route) => ({
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        rideType: route.rideType,
        cargo: route.cargo,
        routeSummary: route.routeSummary,
        dieselPrice: route.dieselPrice,
        costEstimate: route.costEstimate,
        vendors: route.vendors || [],
      })),
      totalRoutes,
      totalTrips,
      averageDieselPrice,
      suggestedPriceRange: {
        min: minSuggestedPrice,
        max: maxSuggestedPrice,
      },
    });

    if (result?.success) {
      dispatch(clearRequestPackage());
      dispatch(resetTripState());
      navigation.replace('RequestSuccess', { requestID: result.id });
    } else {
      Alert.alert(
        localized('Error'),
        localized('Could not save the request. Please try again.')
      );
    }
  };

  const firstRoute = evaluatedRoutes[0];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors[appearance].primaryBackground,
      }}
    >
      <MapView
        ref={mapRef}
        style={{ height: height * 0.3 }}
        initialRegion={{
          latitude: firstRoute?.origin?.latitude ?? 0,
          longitude: firstRoute?.origin?.longitude ?? 0,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {evaluatedRoutes.map((route, index) =>
          route?.origin?.latitude && route?.origin?.longitude ? (
            <Marker
              key={`origin-${route.id}-${index}`}
              coordinate={{
                latitude: route.origin.latitude,
                longitude: route.origin.longitude,
              }}
              title={`${localized("Origin")} ${index + 1}`}
            />
          ) : null,
        )}

        {evaluatedRoutes.map((route, index) =>
          route?.destination?.latitude && route?.destination?.longitude ? (
            <Marker
              key={`destination-${route.id}-${index}`}
              coordinate={{
                latitude: route.destination.latitude,
                longitude: route.destination.longitude,
              }}
              title={`${localized("Destination")} ${index + 1}`}
            />
          ) : null,
        )}

        {evaluatedRoutes.map((route, index) =>
          route?.routeCoords?.length ? (
            <Polyline
              key={`polyline-${route.id}-${index}`}
              coordinates={route.routeCoords}
              strokeColor="#007aff"
              strokeWidth={4}
            />
          ) : null,
        )}

        {evaluatedRoutes.flatMap((route) =>
          (route.vendors || []).map((company: any, index: number) =>
            company.lat && company.lng ? (
              <Marker
                key={`vendor-${route.id}-${company.id ?? index}`}
                coordinate={{
                  latitude: company.lat,
                  longitude: company.lng,
                }}
                title={company.vendorName}
                description={company.vendorLocation}
                pinColor="green"
              />
            ) : null,
          ),
        )}
      </MapView>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.loaderText}>
            {localized("Calculating routes and pricing...")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.sectionTitle}>
            {localized("Package Summary")}
          </Text>

          <View style={styles.sectionBox}>
            <Text style={styles.label}>
              {localized("Routes")}: {totalRoutes}
            </Text>
            <Text style={styles.label}>
              {localized("Total Trips")}: {totalTrips}
            </Text>
            <Text style={styles.label}>
              {localized("Available vendors")}: {totalVendors}
            </Text>
          </View>

          {evaluatedRoutes.map((route, index) => (
            <View key={route.id} style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>
                {localized("Route")} {index + 1}
              </Text>

              <Text style={styles.label}>
                {localized("From")}: {route?.origin?.title}
              </Text>
              <Text style={styles.label}>
                {localized("To")}: {route?.destination?.title}
              </Text>
              <Text style={styles.label}>
                {localized("Number of Trips")}: {route?.cargo?.trips}
              </Text>
              <Text style={styles.label}>
                {localized("Daily Trips")}: {route?.cargo?.dailyTrips}
              </Text>
              <Text style={styles.label}>
                {localized("Start Date")}:{" "}
                {route?.cargo?.startDate
                  ? new Date(route.cargo.startDate).toDateString()
                  : "—"}
              </Text>
              <Text style={styles.label}>
                {localized("End Date")}:{" "}
                {route?.cargo?.endDate
                  ? new Date(route.cargo.endDate).toDateString()
                  : "—"}
              </Text>
              <Text style={styles.label}>
                {localized("Cargo Description")}: {route?.cargo?.description}
              </Text>

              <Text style={[styles.label, { marginTop: 12 }]}>
                {localized("Distance")}:{" "}
                {route?.routeSummary?.distanceMiles?.toFixed?.(2) ?? "—"} mi
              </Text>
              <Text style={styles.label}>
                {localized("Duration")}:{" "}
                {route?.routeSummary?.durationMinutes ?? "—"} min
              </Text>
              <Text style={styles.label}>
                {localized("Tolls")}: {route?.routeSummary?.tollsCount ?? "—"}
              </Text>
              <Text style={styles.label}>
                {localized("Toll Cost")}: $
                {route?.routeSummary?.tollsCostUSD?.toFixed?.(2) ?? "—"}
              </Text>
              <Text style={styles.label}>
                {localized("Suggested Range")}: $
                {route?.costEstimate?.precioMin ?? "—"} - $
                {route?.costEstimate?.precioMax ?? "—"}
              </Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>{localized("Offer Summary")}</Text>

          <View style={styles.offerRow}>
            <View style={styles.offerBoxLeft}>
              <Text style={styles.offerNumber}>{totalVendors}</Text>
              <Text style={styles.offerLabel}>
                {localized("Available vendors")}
              </Text>
            </View>

            <View style={styles.offerBoxRight}>
              <Text style={styles.offerPrice}>
                {formatCurrency(minSuggestedPrice)} -{" "}
                {formatCurrency(maxSuggestedPrice)}
              </Text>
              <Text style={styles.offerLabel}>
                {localized("Suggested package range")}
              </Text>
            </View>
          </View>

          <View style={styles.fuelBox}>
            <Text style={styles.fuelText}>
              {localized("Average diesel price")}: $
              {averageDieselPrice?.toFixed?.(2) ?? "—"} USD/gal
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>{localized("Go Back")}</Text>
            </Pressable>

            <Pressable
              onPress={onSendRequest}
              disabled={loading}
              style={[
                styles.sendButton,
                loading && { backgroundColor: "#9ca3af" },
              ]}
            >
              <Text style={styles.sendButtonText}>
                {localized("Send Request")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default ReviewRequestScreen;