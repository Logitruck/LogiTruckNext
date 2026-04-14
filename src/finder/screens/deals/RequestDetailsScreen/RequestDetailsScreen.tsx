import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './RequestDetailsScreen.styles';

import useRequestDetails from '../../../hooks/useRequestDetails';
import useUpdateRequestStatus from '../../../hooks/useUpdateRequestStatus';
import useRejectVendorOffer from '../../../hooks/useRejectVendorOffer';
import useSendChecklist from '../../../hooks/useSendChecklist';

import OffersManagementSection from '../../../components/RequestSections/OffersManagementSection';
import AcceptedOfferSection from '../../../components/RequestSections/AcceptedOfferSection';
import ReviewApprovalSection from '../../../components/RequestSections/ReviewApprovalSection';
import SetupProjectButton from '../../../../core/components/buttons/SetupProjectButton';

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toDateString();
};

const getRouteLabel = (
  route: any,
  localized: (key: string) => string,
  index: number,
) => {
  const originTitle = route?.origin?.title ?? localized('Unknown origin');
  const destinationTitle =
    route?.destination?.title ?? localized('Unknown destination');

  if (
    originTitle === localized('Unknown origin') &&
    destinationTitle === localized('Unknown destination')
  ) {
    return `${localized('Route')} ${index + 1}`;
  }

  return `${originTitle} → ${destinationTitle}`;
};

const getGeneralSummary = (request: any) => {
  const routes = request?.routes || [];
  const firstRoute = routes[0];

  const totalRoutes = request?.totalRoutes || routes.length;
  const totalTrips =
    request?.totalTrips ||
    routes.reduce(
      (sum: number, currentRoute: any) =>
        sum + Number(currentRoute?.cargo?.trips || 0),
      0,
    );

  const startDate = firstRoute?.cargo?.startDate;

  return {
    totalRoutes,
    totalTrips,
    startDate,
  };
};

const RequestDetailsScreen = () => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { requestID } = route.params;

  const { request, offers, loading, error } = useRequestDetails(requestID);
  const updateStatus = useUpdateRequestStatus();
  const rejectVendorOffer = useRejectVendorOffer();
  const sendChecklist = useSendChecklist();
 const [showPackageDetails, setShowPackageDetails] = useState(false);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Deal Details'),
      headerBackTitleVisible: false,
    });
  }, [navigation, localized]);

  const summary = useMemo(() => {
    return getGeneralSummary(request);
  }, [request]);

  const handleAccept = async (vendorID: string) => {
    try {
      await updateStatus({
        requestID,
        status: 'accepted',
        vendorID,
      });
      Alert.alert(localized('Success'), localized('Offer accepted'));
    } catch (error: any) {
      Alert.alert(
        localized('Error'),
        error?.message ?? localized('Unexpected error'),
      );
    }
  };

  const handleReject = async (vendorID: string) => {
    try {
      await rejectVendorOffer({ requestID, vendorID });
      Alert.alert(localized('Success'), localized('Offer rejected'));
    } catch (error: any) {
      Alert.alert(
        localized('Error'),
        error?.message ?? localized('Unexpected error'),
      );
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      await updateStatus({
        requestID: id,
        status: 'cancelled',
      });
      Alert.alert(localized('Success'), localized('Request cancelled'));
    } catch (error: any) {
      Alert.alert(
        localized('Error'),
        error?.message ?? localized('Unexpected error'),
      );
    }
  };

  const handleSendChecklist = async () => {
    try {
      await sendChecklist({ requestID });
      Alert.alert(localized('Success'), localized('Checklist sent'));
    } catch (error: any) {
      Alert.alert(
        localized('Error'),
        error?.message ?? localized('Unexpected error'),
      );
    }
  };

  const goToChecklist = (
    currentRequestID: string,
    vendorID: string,
    checklistItems: any[],
  ) => {
    navigation.navigate('Checklist', {
      requestID: currentRequestID,
      vendorID,
      initialChecklist: checklistItems,
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      </View>
    );
  }

  if (error || !request || !request?.routes?.length) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.executionNotice}>
          {localized('Request not found or unavailable.')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{localized('Package Summary')}</Text>

        <Text style={styles.summaryText}>
          {localized('Routes')}: {summary.totalRoutes}
        </Text>

        <Text style={styles.summaryText}>
          {localized('Trips')}: {summary.totalTrips}
        </Text>

        <Text style={styles.summaryText}>
          {localized('Start date')}: {formatDate(summary.startDate)}
        </Text>

        <Text style={styles.summaryText}>
          {localized('Offers received')}: {offers?.length || 0}
        </Text>

        <Text style={styles.summaryText}>
          {localized('Status')}: {request.status}
        </Text>
      </View>

<View style={styles.routesSection}>
  <Pressable
    style={styles.routesHeaderRow}
    onPress={() => setShowPackageDetails((prev) => !prev)}
  >
    <Text style={styles.sectionTitle}>{localized('Routes in package')}</Text>
    <Text style={styles.routesToggleText}>
      {showPackageDetails
        ? localized('Hide details')
        : localized('Show details')}
    </Text>
  </Pressable>

  {showPackageDetails ? (
    request.routes.map((currentRoute: any, index: number) => (
      <View key={currentRoute?.id || index} style={styles.routeCard}>
        <Text style={styles.routeCardTitle}>
          {getRouteLabel(currentRoute, localized, index)}
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Trips')}: {currentRoute?.cargo?.trips ?? '—'}
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Daily Trips')}: {currentRoute?.cargo?.dailyTrips ?? '—'}
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Start date')}: {formatDate(currentRoute?.cargo?.startDate)}
        </Text>

        <Text style={styles.routeCardText}>
          {localized('End date')}: {formatDate(currentRoute?.cargo?.endDate)}
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Distance')}: {currentRoute?.routeSummary?.distanceMiles ?? '—'} mi
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Duration')}: {currentRoute?.routeSummary?.durationMinutes ?? '—'} min
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Tolls')}: ${currentRoute?.routeSummary?.tollsCostUSD ?? '—'}
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Diesel')}: ${currentRoute?.dieselPrice ?? '—'}
        </Text>

        <Text style={styles.routeCardText}>
          {localized('Suggested range')}: $
          {currentRoute?.costEstimate?.precioMin ?? '—'} - $
          {currentRoute?.costEstimate?.precioMax ?? '—'}
        </Text>

        {currentRoute?.cargo?.description ? (
          <Text style={styles.routeCardText}>
            {localized('Description')}: {currentRoute.cargo.description}
          </Text>
        ) : null}
      </View>
    ))
  ) : null}
</View>

      {(request.status === 'sending' || request.status === 'offered') && (
        <OffersManagementSection
          offers={offers}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {request.status === 'sending' && (
        <Pressable
          style={styles.cancelButton}
          onPress={() => handleCancelRequest(request.id)}
        >
          <Text style={styles.cancelButtonText}>
            {localized('Cancel Request')}
          </Text>
        </Pressable>
      )}

      {request.status === 'accepted' && (
        <AcceptedOfferSection
          request={request}
          onRequestDocuments={goToChecklist}
          onSendChecklist={handleSendChecklist}
        />
      )}

      {request.status === 'to_sign' && (
        <ReviewApprovalSection request={request} />
      )}

      {request.status === 'execution' && (
        <>
          <SetupProjectButton
            onPress={() => {
              if (!request?.channelID) {
                Alert.alert(
                  localized('Error'),
                  localized('This project does not have an assigned channel yet.'),
                );
                return;
              }

              navigation.navigate('FinderProjectsTab', {
                screen: 'ProjectsMain',
                params: {
                  screen: 'ProjectSetup',
                  params: {
                    channelID: request.channelID,
                    projectID: request.id,
                    initialData: request,
                  },
                },
              });
            }}
          />

          <Text style={styles.executionNotice}>
            {localized('The project is in execution phase.')}
          </Text>
        </>
      )}
    </ScrollView>
  );
};

export default RequestDetailsScreen;