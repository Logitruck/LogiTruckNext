import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './ReviewApprovalSection.styles';
import useVendorOffer from '../../../hooks/useVendorOffer';
import RouteMap from '../../../../core/components/maps/routeMap';

type ReviewApprovalSectionProps = {
  request: any;
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toDateString();
};

const getPackageSummary = (request: any, localized: (key: string) => string) => {
  const routes = request?.routes || [];
  const firstRoute = routes[0];

  const totalRoutes = request?.totalRoutes || routes.length;
  const totalTrips =
    request?.totalTrips ||
    routes.reduce(
      (sum: number, route: any) => sum + Number(route?.cargo?.trips || 0),
      0
    );

  const averageDiesel =
    typeof request?.averageDieselPrice === 'number'
      ? request.averageDieselPrice
      : routes.length > 0
      ? routes.reduce(
          (sum: number, route: any) => sum + Number(route?.dieselPrice || 0),
          0
        ) / routes.length
      : null;

  const totalTollsCost = routes.reduce(
    (sum: number, route: any) =>
      sum + Number(route?.routeSummary?.tollsCostUSD || 0),
    0
  );

  const totalDistance = routes.reduce(
    (sum: number, route: any) =>
      sum + Number(route?.routeSummary?.distanceMiles || 0),
    0
  );

  const totalDuration = routes.reduce(
    (sum: number, route: any) =>
      sum + Number(route?.routeSummary?.durationMinutes || 0),
    0
  );

  const title =
    totalRoutes === 1
      ? `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
          firstRoute?.destination?.title ?? localized('Unknown destination')
        }`
      : `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
          firstRoute?.destination?.title ?? localized('Unknown destination')
        } + ${totalRoutes - 1} ${localized('more routes')}`;

  return {
    routes,
    firstRoute,
    title,
    totalRoutes,
    totalTrips,
    averageDiesel,
    totalTollsCost,
    totalDistance,
    totalDuration,
  };
};

const getOfferSummary = (offer: any) => {
  if (!offer) {
    return {
      totalPrice: '—',
      estimatedDays: '—',
      routeOffers: [],
    };
  }

  return {
    totalPrice: offer?.totalPrice ?? offer?.price ?? '—',
    estimatedDays: offer?.estimatedDays ?? '—',
    routeOffers: offer?.routeOffers || [],
  };
};

const getRouteLabel = (
  route: any,
  localized: (key: string) => string,
  index: number
) => {
  const originTitle = route?.origin?.title ?? localized('Unknown origin');
  const destinationTitle =
    route?.destination?.title ?? localized('Unknown destination');

  return `${originTitle} → ${destinationTitle}`;
};

const ReviewApprovalSection = ({ request }: ReviewApprovalSectionProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const navigation = useNavigation<any>();

  const { offer } = useVendorOffer(request?.id, request?.confirmedVendor);

  const summary = getPackageSummary(request, localized);
  const offerSummary = getOfferSummary(offer);

  const handleSign = () => {
    navigation.navigate('ContractsFlow', {
      screen: 'ContractSigning',
      params: {
        request,
        offer,
        role: 'finder',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <RouteMap encodedPolyline={summary.firstRoute?.routeSummary?.encodedPolyline} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{summary.title}</Text>

          <Text style={styles.infoText}>
            {localized('Routes')}: {summary.totalRoutes}
          </Text>

          <Text style={styles.infoText}>
            {localized('Trips')}: {summary.totalTrips}
          </Text>

          <Text style={styles.infoText}>
            {localized('Distance')}: {summary.totalDistance.toFixed(2)} mi
          </Text>

          <Text style={styles.infoText}>
            {localized('Duration')}: {summary.totalDuration} min
          </Text>

          <Text style={styles.infoText}>
            {localized('Tolls')}: ${summary.totalTollsCost.toFixed(2)}
          </Text>

          <Text style={styles.infoText}>
            {localized('Diesel Price')}: $
            {summary.averageDiesel != null
              ? summary.averageDiesel.toFixed(2)
              : '—'}
          </Text>

          <Text style={styles.sectionTitle}>{localized('Routes Included')}</Text>

          {summary.routes.map((route: any, index: number) => (
            <View key={route?.id || index} style={styles.routeBox}>
              <Text style={styles.routeTitle}>
                {getRouteLabel(route, localized, index)}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('Trips')}: {route?.cargo?.trips ?? '—'}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('Daily Trips')}: {route?.cargo?.dailyTrips ?? '—'}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('Start Date')}: {formatDate(route?.cargo?.startDate)}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('End Date')}: {formatDate(route?.cargo?.endDate)}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('Description')}: {route?.cargo?.description ?? '—'}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('Ride Type')}: {route?.rideType?.title ?? '—'}
              </Text>
            </View>
          ))}

          {offer && (
            <>
              <Text style={styles.sectionTitle}>{localized('Offer')}</Text>

              <Text style={styles.infoText}>
                {localized('Price')}: ${offerSummary.totalPrice}
              </Text>

              <Text style={styles.infoText}>
                {localized('Estimated Days')}: {offerSummary.estimatedDays}
              </Text>

              {offerSummary.routeOffers.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>
                    {localized('Offer Breakdown')}
                  </Text>

                  {offerSummary.routeOffers.map(
                    (routeOffer: any, index: number) => {
                      const relatedRoute =
                        summary.routes.find(
                          (route: any) => route?.id === routeOffer?.routeID
                        ) || null;

                      return (
                        <View
                          key={routeOffer?.routeID || index}
                          style={styles.routeBox}
                        >
                          <Text style={styles.routeTitle}>
                            {relatedRoute
                              ? getRouteLabel(relatedRoute, localized, index)
                              : `${localized('Route')} ${index + 1}`}
                          </Text>

                          <Text style={styles.routeMeta}>
                            {localized('Price per trip')}: $
                            {routeOffer?.pricePerTrip ?? '—'}
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
                    }
                  )}
                </>
              )}
            </>
          )}

          <Pressable style={styles.acceptButton} onPress={handleSign}>
            <Text style={styles.acceptButtonText}>
              {localized('Sign Contract')}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewApprovalSection;