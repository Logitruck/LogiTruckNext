import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { decode } from '@liberty-rider/flexpolyline';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';

import useRequestDetails from '../../../hooks/useRequestDetails';
import useRejectOffer from '../../../hooks/useRejectOffer';
import useVendorOffer from '../../../hooks/useVendorOffer';

type DecodedCoordinate = {
  latitude: number;
  longitude: number;
};

type RouteOfferStatus = 'pending' | 'prepared' | 'not_offering';

type RouteOfferDraftItem = {
  routeID: string;
  status: RouteOfferStatus;
  pricePerTrip: string;
  tripsOffered: string;
  notes: string;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toDateString();
};

const getRouteLabel = (
  routeItem: any,
  localized: (key: string) => string,
  index: number,
) => {
  const originTitle = routeItem?.origin?.title ?? localized('Unknown origin');
  const destinationTitle =
    routeItem?.destination?.title ?? localized('Unknown destination');

  if (
    originTitle === localized('Unknown origin') &&
    destinationTitle === localized('Unknown destination')
  ) {
    return `${localized('Route')} ${index + 1}`;
  }

  return `${originTitle} → ${destinationTitle}`;
};

const getStatusLabel = (
  status: RouteOfferStatus,
  localized: (key: string) => string,
) => {
  if (status === 'prepared') return localized('Prepared');
  if (status === 'not_offering') return localized('Not Offering');
  return localized('Pending');
};

const RequestDetailsScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);

  const requestID = route?.params?.requestID;

  const { request, loading } = useRequestDetails(requestID);
  const { offer: vendorOffer } = useVendorOffer(requestID);
  const { rejectOffer } = useRejectOffer();

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const routes = request?.routes || [];

  const [routeDrafts, setRouteDrafts] = useState<RouteOfferDraftItem[]>([]);
  const [activeRouteID, setActiveRouteID] = useState<string | null>(null);
  const [modalPricePerTrip, setModalPricePerTrip] = useState('');
  const [modalTripsOffered, setModalTripsOffered] = useState('');
  const [modalNotes, setModalNotes] = useState('');

  useEffect(() => {
    if (!routes.length) return;

    setRouteDrafts((prev) => {
      if (prev.length > 0) return prev;

      return routes.map((currentRoute: any) => ({
        routeID: currentRoute.id,
        status: 'pending',
        pricePerTrip: '',
        tripsOffered: String(currentRoute?.cargo?.trips || ''),
        notes: '',
      }));
    });
  }, [routes]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Deal Details'),
    });
  }, [navigation, localized]);

  const selectedRoute = routes[selectedRouteIndex] || null;

  const summary = useMemo(() => {
    const totalRoutes = request?.totalRoutes || routes.length;
    const totalTrips =
      request?.totalTrips ||
      routes.reduce(
        (sum: number, currentRoute: any) =>
          sum + Number(currentRoute?.cargo?.trips || 0),
        0,
      );

    const startDate = routes[0]?.cargo?.startDate;

    const totalTollsCount = routes.reduce(
      (sum: number, currentRoute: any) =>
        sum + Number(currentRoute?.routeSummary?.tollsCount || 0),
      0,
    );

    const totalTollsCost = routes
      .reduce(
        (sum: number, currentRoute: any) =>
          sum + Number(currentRoute?.routeSummary?.tollsCostUSD || 0),
        0,
      )
      .toFixed(2);

    return {
      totalRoutes,
      totalTrips,
      startDate,
      totalTollsCount,
      totalTollsCost,
    };
  }, [request, routes]);

  const decodedPolyline = useMemo<DecodedCoordinate[]>(() => {
    if (!selectedRoute?.routeSummary?.encodedPolyline) {
      return [];
    }

    try {
      const decoded = decode(selectedRoute.routeSummary.encodedPolyline);
      const polyline = Array.isArray(decoded?.polyline) ? decoded.polyline : [];

      return polyline.map(([lat, lon]: [number, number]) => ({
        latitude: lat,
        longitude: lon,
      }));
    } catch (error) {
      console.warn('Error decoding polyline:', error);
      return [];
    }
  }, [selectedRoute?.routeSummary?.encodedPolyline]);

  const fitMapToPolyline = () => {
    if (mapRef.current && decodedPolyline.length > 1) {
      mapRef.current.fitToCoordinates(decodedPolyline, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fitMapToPolyline();
    }, 250);

    return () => clearTimeout(timeout);
  }, [decodedPolyline]);

  const preparedRoutesCount = useMemo(() => {
    return routeDrafts.filter((item) => item.status === 'prepared').length;
  }, [routeDrafts]);

  const notOfferingCount = useMemo(() => {
    return routeDrafts.filter((item) => item.status === 'not_offering').length;
  }, [routeDrafts]);

  const pendingCount = useMemo(() => {
    return routeDrafts.filter((item) => item.status === 'pending').length;
  }, [routeDrafts]);

  const totalDraftPrice = useMemo(() => {
    const total = routeDrafts.reduce((sum, item) => {
      if (item.status !== 'prepared') return sum;
      return sum + Number(item.pricePerTrip || 0) * Number(item.tripsOffered || 0);
    }, 0);

    return total.toFixed(2);
  }, [routeDrafts]);

  const canContinueToSummary = useMemo(() => {
    return preparedRoutesCount > 0 && pendingCount === 0;
  }, [preparedRoutesCount, pendingCount]);

  const openRouteModal = (routeID: string) => {
    const currentState = routeDrafts.find((item) => item.routeID === routeID);

    setActiveRouteID(routeID);
    setModalPricePerTrip(currentState?.pricePerTrip || '');
    setModalTripsOffered(currentState?.tripsOffered || '');
    setModalNotes(currentState?.notes || '');
  };

  const closeRouteModal = () => {
    setActiveRouteID(null);
    setModalPricePerTrip('');
    setModalTripsOffered('');
    setModalNotes('');
  };

  const saveRouteOffer = () => {
    if (!activeRouteID) return;

    const price = Number(modalPricePerTrip);
    const trips = Number(modalTripsOffered);

    if (Number.isNaN(price) || price <= 0 || Number.isNaN(trips) || trips <= 0) {
      Alert.alert(
        localized('Error'),
        localized('Please enter valid price and trips for this route'),
      );
      return;
    }

    setRouteDrafts((prev) =>
      prev.map((item) =>
        item.routeID === activeRouteID
          ? {
              ...item,
              status: 'prepared',
              pricePerTrip: modalPricePerTrip,
              tripsOffered: modalTripsOffered,
              notes: modalNotes,
            }
          : item,
      ),
    );

    closeRouteModal();
  };

  const markRouteAsNotOffering = (routeID: string) => {
    setRouteDrafts((prev) =>
      prev.map((item) =>
        item.routeID === routeID
          ? {
              ...item,
              status: 'not_offering',
            }
          : item,
      ),
    );
  };

  const handleContinueToSummary = () => {
    navigation.navigate('PrepareOffer', {
      request,
      routeDrafts,
    });
  };

  const handleRejectRequest = () => {
    Alert.alert(
      localized('Reject Request'),
      localized('Are you sure to reject this request?'),
      [
        { text: localized('Cancel'), style: 'cancel' },
        {
          text: localized('Reject'),
          onPress: async () => {
            try {
              setActionLoading(true);

              await rejectOffer({
                requestID,
                status: 'rejected',
              });

              Alert.alert(
                localized('Rejected'),
                localized('Request has been rejected.'),
              );

              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                localized('Error'),
                error?.message ?? localized('Something went wrong.'),
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleCancelOffer = () => {
    Alert.alert(
      localized('Cancel Offer'),
      localized('Are you sure to cancel your offer?'),
      [
        { text: localized('Cancel'), style: 'cancel' },
        {
          text: localized('Yes, cancel'),
          onPress: async () => {
            try {
              setActionLoading(true);

              await rejectOffer({
                requestID,
                status: 'cancelled',
              });

              Alert.alert(
                localized('Cancelled'),
                localized('Offer has been cancelled.'),
              );

              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                localized('Error'),
                error?.message ?? localized('Something went wrong.'),
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading || !request) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.mapFill}
            initialRegion={{
              latitude:
                selectedRoute?.origin?.lat ||
                selectedRoute?.origin?.latitude ||
                0,
              longitude:
                selectedRoute?.origin?.lon ||
                selectedRoute?.origin?.longitude ||
                0,
              latitudeDelta: 0.3,
              longitudeDelta: 0.3,
            }}
            onMapReady={fitMapToPolyline}
          >
            {selectedRoute?.origin && (
              <Marker
                coordinate={{
                  latitude:
                    selectedRoute.origin.lat || selectedRoute.origin.latitude,
                  longitude:
                    selectedRoute.origin.lon || selectedRoute.origin.longitude,
                }}
                title={localized('Origin')}
                pinColor="green"
              />
            )}

            {selectedRoute?.destination && (
              <Marker
                coordinate={{
                  latitude:
                    selectedRoute.destination.lat ||
                    selectedRoute.destination.latitude,
                  longitude:
                    selectedRoute.destination.lon ||
                    selectedRoute.destination.longitude,
                }}
                title={localized('Destination')}
                pinColor="red"
              />
            )}

            {decodedPolyline.length > 0 && (
              <Polyline
                coordinates={decodedPolyline}
                strokeWidth={4}
                strokeColor={theme.colors[appearance].primaryForeground}
              />
            )}
          </MapView>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{localized('Package Summary')}</Text>

            <Text style={styles.cardSubtitle}>
              {localized('Status')}: {request.status ?? '—'}
            </Text>

            <Text style={styles.cardSubtitle}>
              {localized('Routes')}: {summary.totalRoutes}
            </Text>

            <Text style={styles.cardSubtitle}>
              {localized('Trips')}: {summary.totalTrips}
            </Text>

            <Text style={styles.cardSubtitle}>
              {localized('Start Date')}: {formatDate(summary.startDate)}
            </Text>

            {request.status === 'pending' ? (
              <>
                <Text style={styles.cardSubtitle}>
                  {localized('Prepared')}: {preparedRoutesCount}
                </Text>

                <Text style={styles.cardSubtitle}>
                  {localized('Not offering')}: {notOfferingCount}
                </Text>

                <Text style={styles.cardSubtitle}>
                  {localized('Pending')}: {pendingCount}
                </Text>

                <Text style={styles.cardSubtitle}>
                  {localized('Draft total')}: ${totalDraftPrice}
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {localized('Routes included')}
            </Text>

            {routes.map((routeItem: any, index: number) => {
              const routeState = routeDrafts.find(
                (item) => item.routeID === routeItem.id,
              );

              const submittedRouteOffer =
                vendorOffer?.offer?.routeOffers?.find(
                  (currentRouteOffer: any) =>
                    currentRouteOffer?.routeID === routeItem?.id,
                ) || null;

              return (
                <Pressable
                  key={routeItem?.id || index}
                  style={[
                    styles.routeBox,
                    selectedRouteIndex === index
                      ? styles.routeBoxSelected
                      : null,
                  ]}
                  onPress={() => setSelectedRouteIndex(index)}
                >
                  <Text style={styles.routeTitle}>
                    {getRouteLabel(routeItem, localized, index)}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Trips')}: {routeItem?.cargo?.trips ?? '—'}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Daily Trips')}: {routeItem?.cargo?.dailyTrips ?? '—'}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Start Date')}: {formatDate(routeItem?.cargo?.startDate)}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Distance')}: {routeItem?.routeSummary?.distanceMiles ?? '—'} mi
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Duration')}: {routeItem?.routeSummary?.durationMinutes ?? '—'} min
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Diesel Price')}: ${routeItem?.dieselPrice ?? '—'}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Suggested per route')}: $
                    {routeItem?.costEstimate?.precioMin ?? '—'} - $
                    {routeItem?.costEstimate?.precioMax ?? '—'}
                  </Text>

                  {request.status === 'pending' ? (
                    <>
                      <Text style={styles.routeMeta}>
                        {localized('Status')}:{' '}
                        {getStatusLabel(
                          routeState?.status || 'pending',
                          localized,
                        )}
                      </Text>

                      {routeState?.status === 'prepared' ? (
                        <View style={styles.routePreparedBox}>
                          <Text style={styles.routeMeta}>
                            {localized('Price per trip')}: ${routeState.pricePerTrip}
                          </Text>
                          <Text style={styles.routeMeta}>
                            {localized('Trips offered')}: {routeState.tripsOffered}
                          </Text>
                          {routeState.notes ? (
                            <Text style={styles.routeMeta}>
                              {localized('Notes')}: {routeState.notes}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}

                      <View style={styles.routeActionsRow}>
                        <Pressable
                          style={styles.routePrimaryButton}
                          onPress={() => openRouteModal(routeItem.id)}
                        >
                          <Text style={styles.routePrimaryButtonText}>
                            {routeState?.status === 'prepared'
                              ? localized('Edit Offer')
                              : localized('Prepare Offer')}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.routeSecondaryButton}
                          onPress={() => markRouteAsNotOffering(routeItem.id)}
                        >
                          <Text style={styles.routeSecondaryButtonText}>
                            {localized('Not Offering')}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}

                  {request.status === 'offered' ? (
                    submittedRouteOffer ? (
                      <View style={styles.routePreparedBox}>
                        <Text style={styles.routeMeta}>
                          {localized('Offer status')}: {localized('Submitted')}
                        </Text>
                        <Text style={styles.routeMeta}>
                          {localized('Price per trip')}: $
                          {submittedRouteOffer?.pricePerTrip ?? '—'}
                        </Text>
                        <Text style={styles.routeMeta}>
                          {localized('Trips offered')}: {submittedRouteOffer?.tripsOffered ?? '—'}
                        </Text>
                        {submittedRouteOffer?.notes ? (
                          <Text style={styles.routeMeta}>
                            {localized('Notes')}: {submittedRouteOffer.notes}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <View style={styles.routePreparedBox}>
                        <Text style={styles.routeMeta}>
                          {localized('Offer status')}: {localized('Not offered in your submission')}
                        </Text>
                      </View>
                    )
                  ) : null}

                  {request.status === 'accepted'
                    ? (() => {
                        const acceptedRouteOffer =
                          vendorOffer?.offer?.routeOffers?.find(
                            (currentRouteOffer: any) =>
                              currentRouteOffer?.routeID === routeItem?.id,
                          ) || null;

                        return acceptedRouteOffer ? (
                          <View style={styles.routePreparedBox}>
                            <Text style={styles.routeMeta}>
                              {localized('Accepted in offer')}: {localized('Yes')}
                            </Text>
                            <Text style={styles.routeMeta}>
                              {localized('Price per trip')}: $
                              {acceptedRouteOffer?.pricePerTrip ?? '—'}
                            </Text>
                            <Text style={styles.routeMeta}>
                              {localized('Trips offered')}: {acceptedRouteOffer?.tripsOffered ?? '—'}
                            </Text>
                            {acceptedRouteOffer?.notes ? (
                              <Text style={styles.routeMeta}>
                                {localized('Notes')}: {acceptedRouteOffer.notes}
                              </Text>
                            ) : null}
                          </View>
                        ) : (
                          <View style={styles.routePreparedBox}>
                            <Text style={styles.routeMeta}>
                              {localized('Accepted in offer')}: {localized('No')}
                            </Text>
                          </View>
                        );
                      })()
                    : null}
                </Pressable>
              );
            })}
          </View>

          {(request.status === 'offered' || request.status === 'accepted') && vendorOffer ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {request.status === 'accepted'
                  ? localized('Accepted Offer')
                  : localized('Submitted Offer')}
              </Text>

              <Text style={styles.infoText}>
                {localized('Matched routes')}: {vendorOffer?.matchedRoutesCount ?? '—'}
              </Text>

              <Text style={styles.infoText}>
                {localized('Trips covered')}: {vendorOffer?.offer?.totalTrips ?? '—'}
              </Text>

              <Text style={styles.infoText}>
                {localized('Offer')}: ${vendorOffer?.offer?.totalPrice ?? '—'}
              </Text>

              <Text style={styles.infoText}>
                {localized('Estimated Days')}: {vendorOffer?.offer?.estimatedDays ?? '—'}
              </Text>

              <Text style={styles.infoText}>
                {localized('Available Trucks')}: {vendorOffer?.offer?.availableTrucks ?? '—'}
              </Text>

              <Text style={styles.infoText}>
                {localized('Comment')}: {vendorOffer?.offer?.comment ?? '—'}
              </Text>

              {(vendorOffer?.offer?.routeOffers || []).map(
                (routeOffer: any, index: number) => {
                  const matchedRoute =
                    vendorOffer?.matchedRoutes?.find(
                      (currentRoute: any) => currentRoute?.id === routeOffer?.routeID,
                    ) || null;

                  return (
                    <View
                      key={routeOffer?.routeID || index}
                      style={styles.routeOfferBox}
                    >
                      <Text style={styles.routeTitle}>
                        {matchedRoute
                          ? getRouteLabel(matchedRoute, localized, index)
                          : `${localized('Route')} ${index + 1}`}
                      </Text>

                      <Text style={styles.routeMeta}>
                        {localized('Price per trip')}: ${routeOffer?.pricePerTrip ?? '—'}
                      </Text>

                      <Text style={styles.routeMeta}>
                        {localized('Trips offered')}: {routeOffer?.tripsOffered ?? '—'}
                      </Text>

                      {routeOffer?.notes ? (
                        <Text style={styles.routeMeta}>
                          {localized('Notes')}: {routeOffer.notes}
                        </Text>
                      ) : null}
                    </View>
                  );
                },
              )}
            </View>
          ) : null}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {(request.status === 'pending' ||
          request.status === 'offered' ||
          request.status === 'accepted' ||
          request.status === 'execution' ||
          request.status === 'to_sign') && (
          <View style={styles.bottomButtonContainer}>
            {request.status === 'pending' && (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[
                    styles.acceptButton,
                    !canContinueToSummary ? styles.buttonDisabled : null,
                  ]}
                  onPress={handleContinueToSummary}
                  disabled={!canContinueToSummary || actionLoading}
                >
                  <Text style={styles.acceptButtonText}>
                    {localized('Continue to Offer Summary')}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.rejectButton}
                  onPress={handleRejectRequest}
                  disabled={actionLoading}
                >
                  <Text style={styles.rejectButtonText}>
                    {localized('Reject Request')}
                  </Text>
                </Pressable>
              </View>
            )}

            {request.status === 'offered' && (
              <Pressable
                style={styles.rejectButton}
                onPress={handleCancelOffer}
                disabled={actionLoading}
              >
                <Text style={styles.rejectButtonText}>
                  {localized('Cancel Offer')}
                </Text>
              </Pressable>
            )}

            {request.status === 'accepted' && (
              <Pressable
                style={styles.acceptButton}
                onPress={() =>
                  navigation.navigate('ContractsFlow', {
                    screen: 'ContractSummary',
                    params: {
                      request,
                      offer: vendorOffer,
                    },
                  })
                }
              >
                <Text style={styles.acceptButtonText}>
                  {localized('Complete Contract')}
                </Text>
              </Pressable>
            )}

            {request.status === 'to_sign' && (
              <Pressable
                style={styles.acceptButton}
                onPress={() =>
                  navigation.navigate('ContractsFlow', {
                    screen: 'ContractSigning',
                    params: {
                      request,
                      offer: vendorOffer,
                      role: 'carrier',
                    },
                  })
                }
              >
                <Text style={styles.acceptButtonText}>
                  {localized('Sign Contract')}
                </Text>
              </Pressable>
            )}

            {request.status === 'execution' && (
              <Pressable
                style={styles.acceptButton}
                onPress={() => {
                  if (!request?.channelID) {
                    Alert.alert(
                      localized('Error'),
                      localized(
                        'This project does not have an assigned channel yet.',
                      ),
                    );
                    return;
                  }

                  navigation.navigate('CarrierProjectsTab', {
                    screen: 'ProjectsCarrierMain',
                    params: {
                      screen: 'ProjectCarrierSetup',
                      params: {
                        channelID: request.channelID,
                        projectID: request.id,
                        initialData: request,
                      },
                    },
                  });
                }}
              >
                <Text style={styles.acceptButtonText}>
                  {localized('Setup Project')}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </SafeAreaView>

      <Modal
        visible={!!activeRouteID}
        transparent
        animationType="slide"
        onRequestClose={closeRouteModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboardContainer}
            >
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>
                    {localized('Route Offer Details')}
                  </Text>

                  {activeRouteID ? (
                    <>
                      <Text style={styles.routeTitle}>
                        {getRouteLabel(
                          routes.find((item: any) => item.id === activeRouteID),
                          localized,
                          routes.findIndex((item: any) => item.id === activeRouteID),
                        )}
                      </Text>

                      <Pressable
                        style={styles.keyboardDismissButton}
                        onPress={() => Keyboard.dismiss()}
                      >
                        <Text style={styles.keyboardDismissButtonText}>
                          {localized('Done')}
                        </Text>
                      </Pressable>

                      <Text style={styles.label}>{localized('Price per Trip')}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={localized('Enter price per trip')}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={() => Keyboard.dismiss()}
                        value={modalPricePerTrip}
                        onChangeText={setModalPricePerTrip}
                        placeholderTextColor={theme.colors[appearance].secondaryText}
                      />

                      <Text style={styles.label}>{localized('Trips Offered')}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={localized('Enter trips offered')}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={() => Keyboard.dismiss()}
                        value={modalTripsOffered}
                        onChangeText={setModalTripsOffered}
                        placeholderTextColor={theme.colors[appearance].secondaryText}
                      />

                      <Text style={styles.label}>{localized('Notes')}</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={localized('Optional notes for this route')}
                        multiline
                        value={modalNotes}
                        onChangeText={setModalNotes}
                        placeholderTextColor={theme.colors[appearance].secondaryText}
                      />

                      <View style={styles.modalActionsRow}>
                        <Pressable
                          style={styles.routeSecondaryButton}
                          onPress={closeRouteModal}
                        >
                          <Text style={styles.routeSecondaryButtonText}>
                            {localized('Cancel')}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.routePrimaryButton}
                          onPress={saveRouteOffer}
                        >
                          <Text style={styles.routePrimaryButtonText}>
                            {localized('Save Route Offer')}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default RequestDetailsScreen;