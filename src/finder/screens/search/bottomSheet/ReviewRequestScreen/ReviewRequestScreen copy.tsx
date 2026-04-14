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
import { useSelector } from 'react-redux';
import { functions } from '../../../../../core/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { decode } from '@liberty-rider/flexpolyline';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './ReviewRequestScreen.styles';
import useCreateRequest from '../../../../hooks/useCreateRequest';

const { height } = Dimensions.get('window');

type Coordinate = {
  latitude: number;
  longitude: number;
};


const ReviewRequestScreen = ({ navigation }: { navigation: any }) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const origin = useSelector((state: any) => state.trip?.origin);
  const destination = useSelector((state: any) => state.trip?.destination);
  const cargo = useSelector((state: any) => state.trip?.cargoDetails);
  const selectedRide = useSelector((state: any) => state.ride?.selectedRide);

  const [routeSummary, setRouteSummary] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [dieselPrice, setDieselPrice] = useState<number | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { createRequest } = useCreateRequest();
  const mapRef = useRef<MapView | null>(null);

  const decodePolyline = (polyline: string) => {
    const points = decode(polyline);

    return points.polyline.map(([lat, lon]) => ({
      latitude: parseFloat(String(lat)),
      longitude: parseFloat(String(lon)),
    }));
  };

  useEffect(() => {
    if (!origin?.title || !destination?.title || !selectedRide?.id) {
      navigation.goBack();
      return;
    }

const fetchEvaluation = async () => {
  try {
    setLoading(true);

    console.log('📦 ReviewRequestScreen payload preview', {
      origin,
      destination,
      selectedRide,
      categoryID: selectedRide?.id,
      categoryIDType: typeof selectedRide?.id,
      cargo,
    });

    const getFullTripEvaluation = httpsCallable(functions, 'triprequest');

    const payload = {
      origin: {
        lat: origin.latitude,
        lon: origin.longitude,
        title: origin.title || 'Origin',
      },
      destination: {
        lat: destination.latitude,
        lon: destination.longitude,
        title: destination.title,
      },
      categoryID: selectedRide.id,
      keyword: '',
    };

    console.log('🚚 triprequest payload', payload);

type TripEvaluationResponse = {
  vendors?: any[];
  routeSummary?: any;
  dieselPriceUSD?: number | null;
  estimatedTripCost?: any;
};

const response = await getFullTripEvaluation(payload);

console.log('✅ triprequest response', response.data);

const data = (response.data ?? {}) as TripEvaluationResponse;

const {
  vendors = [],
  routeSummary,
  dieselPriceUSD,
  estimatedTripCost,
} = data;

    setCompanies(vendors);
    setRouteSummary(routeSummary ?? null);
    setDieselPrice(dieselPriceUSD ?? null);
    setCostEstimate(estimatedTripCost ?? null);

    if (routeSummary?.encodedPolyline) {
      const coords = decodePolyline(routeSummary.encodedPolyline);
      setRouteCoords(coords);

      setTimeout(() => {
        if (mapRef.current && coords.length > 0) {
          const allCoords = [
            ...coords,
            ...vendors
              .filter((company: any) => company.lat && company.lng)
              .map((company: any) => ({
                latitude: company.lat,
                longitude: company.lng,
              })),
          ];

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
    }
  } catch (error) {
    console.error('❌ Error fetching evaluation:', error);
    Alert.alert(
      localized('Error'),
      localized('Could not load trip evaluation.')
    );
  } finally {
    setLoading(false);
  }
};

    fetchEvaluation();
  }, [origin, destination, selectedRide, navigation, localized]);

  const onSendRequest = async () => {
    const result = await createRequest({
      origin,
      destination,
      cargo,
      rideType: selectedRide,
      routeSummary,
      dieselPrice,
      costEstimate,
    });

    if (result?.success) {
      navigation.replace('RequestSuccess', { requestID: result.id });
    } else {
      Alert.alert(
        localized('Error'),
        localized('Could not save the request. Please try again.')
      );
    }
  };

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
          latitude: origin?.latitude ?? 0,
          longitude: origin?.longitude ?? 0,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {origin?.latitude && origin?.longitude && (
          <Marker
            coordinate={{
              latitude: origin.latitude,
              longitude: origin.longitude,
            }}
            title={localized('Origin')}
          />
        )}

        {destination?.latitude && destination?.longitude && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={localized('Destination')}
          />
        )}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#007aff"
            strokeWidth={4}
          />
        )}

        {companies.map((company, index) =>
          company.lat && company.lng ? (
            <Marker
              key={`vendor-${company.id ?? index}`}
              coordinate={{
                latitude: company.lat,
                longitude: company.lng,
              }}
              title={company.vendorName}
              description={company.vendorLocation}
              pinColor="green"
            />
          ) : null
        )}
      </MapView>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.loaderText}>
            {localized('Calculating route and pricing...')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.sectionTitle}>{localized('Trip Details')}</Text>
          <View style={styles.sectionBox}>
            <Text style={styles.label}>
              {localized('From')}: {origin?.title}
            </Text>
            <Text style={styles.label}>
              {localized('To')}: {destination?.title}
            </Text>
            <Text style={styles.label}>
              {localized('Number of Trips')}: {cargo?.trips}
            </Text>
            <Text style={styles.label}>
              {localized('Daily Trips')}: {cargo?.dailyTrips}
            </Text>
            <Text style={styles.label}>
              {localized('Start Date')}:{' '}
              {cargo?.startDate ? new Date(cargo.startDate).toDateString() : '—'}
            </Text>
            <Text style={styles.label}>
              {localized('End Date')}:{' '}
              {cargo?.endDate ? new Date(cargo.endDate).toDateString() : '—'}
            </Text>
            <Text style={styles.label}>
              {localized('Cargo Description')}: {cargo?.description}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            {localized('Truck Route Summary')}
          </Text>
          <View style={styles.sectionBox}>
            <Text style={styles.label}>
              {localized('Distance')}: {routeSummary?.distanceMiles?.toFixed?.(2) ?? '—'} mi
            </Text>
            <Text style={styles.label}>
              {localized('Duration')}: {routeSummary?.durationMinutes ?? '—'} min
            </Text>
            <Text style={styles.label}>
              {localized('Tolls')}: {routeSummary?.tollsCount ?? '—'}
            </Text>
            <Text style={styles.label}>
              {localized('Toll Cost')}: $
              {routeSummary?.tollsCostUSD?.toFixed?.(2) ?? '—'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>{localized('Offer Summary')}</Text>
          <View style={styles.offerRow}>
            <View style={styles.offerBoxLeft}>
              <Text style={styles.offerNumber}>{companies.length}</Text>
              <Text style={styles.offerLabel}>
                {localized('Available vendors')}
              </Text>
            </View>

            <View style={styles.offerBoxRight}>
              <Text style={styles.offerPrice}>
                ${costEstimate?.precioMin ?? '—'} - ${costEstimate?.precioMax ?? '—'}
              </Text>
              <Text style={styles.offerLabel}>
                {localized('Suggested price range')}
              </Text>
            </View>
          </View>

          <View style={styles.fuelBox}>
            <Text style={styles.fuelText}>
              {localized('Average diesel price')}: $
              {dieselPrice?.toFixed?.(2) ?? '—'} USD/gal
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>{localized('Go Back')}</Text>
            </Pressable>

            <Pressable
              onPress={onSendRequest}
              disabled={loading}
              style={[
                styles.sendButton,
                loading && { backgroundColor: '#9ca3af' },
              ]}
            >
              <Text style={styles.sendButtonText}>
                {localized('Send Request')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default ReviewRequestScreen;