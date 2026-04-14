import React from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './AcceptedOfferSection.styles';
import useAcceptedOfferDetails from '../../../../modules/contracts/hooks/useContractDetails';
import FinderReviewChecklist from '../../../components/CheckList/CheckListReviewSection';
import useReadyForSignature from '../../../hooks/useReadyForSignature';
import useMarkRequestToSign from '../../../hooks/useMarkRequestToSign';

type AcceptedOfferSectionProps = {
  request: any;
  onRequestDocuments: (
    requestID: string,
    vendorID: string,
    checklistItems: any[]
  ) => void;
  onSendChecklist: () => void;
  onStartChat?: () => void;
};

const formatDateValue = (value: any) => {
  if (!value) return 'N/A';

  if (value?.toDate) {
    return value.toDate().toLocaleDateString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleDateString();
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

const getAcceptedOfferSummary = (acceptedOffer: any) => {
  const routeOffers = acceptedOffer?.routeOffers || [];
  const totalPrice =
    acceptedOffer?.totalPrice ??
    acceptedOffer?.price ??
    '—';

  const estimatedDays =
    acceptedOffer?.estimatedDays ?? '—';

  const availableTrucks =
    acceptedOffer?.availableTrucks ?? '—';

  const estimatedStartDate =
    acceptedOffer?.estimatedStartDate ?? null;

  const comment =
    acceptedOffer?.comment || '—';

  const totalTrips =
    acceptedOffer?.totalTrips ??
    routeOffers.reduce(
      (sum: number, routeOffer: any) =>
        sum + Number(routeOffer?.tripsOffered || 0),
      0
    );

  return {
    routeOffers,
    totalPrice,
    estimatedDays,
    availableTrucks,
    estimatedStartDate,
    comment,
    totalTrips,
  };
};

const AcceptedOfferSection = ({
  request,
  onRequestDocuments,
  onSendChecklist,
  onStartChat,
}: AcceptedOfferSectionProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const {
    acceptedOffer,
    vendorData,
    checklistItems,
    submittedDocuments,
    loading,
    refresh,
  } = useAcceptedOfferDetails(request);

  const isReadyForSignature = useReadyForSignature(
    checklistItems,
    submittedDocuments
  );

  const markToSign = useMarkRequestToSign();

  const handleGoToSign = async () => {
    try {
      await markToSign(request.id);
      Alert.alert(
        localized('Success'),
        localized('Request marked as ready for signature')
      );
    } catch (error) {
      Alert.alert(
        localized('Error'),
        localized('Failed to mark request')
      );
    }
  };

  if (loading || !acceptedOffer) {
    return (
      <Text style={styles.loadingText}>
        {localized('Loading accepted offer...')}
      </Text>
    );
  }

  const summary = getAcceptedOfferSummary(acceptedOffer);
  const requestRoutes = request?.routes || [];
  const totalRoutes = request?.totalRoutes || requestRoutes.length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{localized('Accepted Offer')}</Text>

      <Text style={styles.infoText}>
        {localized('Company')}: {vendorData?.title ?? '—'}
      </Text>

      <Text style={styles.infoText}>
        {localized('Email')}: {vendorData?.email ?? '—'}
      </Text>

      <Text style={styles.infoText}>
        {localized('Routes')}: {totalRoutes}
      </Text>

      <Text style={styles.infoText}>
        {localized('Trips')}: {summary.totalTrips || request?.totalTrips || '—'}
      </Text>

      <Text style={styles.infoText}>
        {localized('Offer')}: ${summary.totalPrice}
      </Text>

      <Text style={styles.infoText}>
        {localized('Estimated Days')}: {summary.estimatedDays}
      </Text>

      <Text style={styles.infoText}>
        {localized('Available Trucks')}: {summary.availableTrucks}
      </Text>

      <Text style={styles.infoText}>
        {localized('Estimated Start Date')}: {formatDateValue(summary.estimatedStartDate)}
      </Text>

      <Text style={styles.infoText}>
        {localized('Comment')}: {summary.comment}
      </Text>

      {summary.routeOffers.length > 0 && (
        <View style={styles.sectionSpacing}>
          <Text style={styles.subtitle}>
            {localized('Accepted Route Breakdown')}:
          </Text>

          {summary.routeOffers.map((routeOffer: any, index: number) => {
            const relatedRoute =
              requestRoutes.find((routeItem: any) => routeItem?.id === routeOffer?.routeID) ||
              null;

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
                  {localized('Price per trips')}: ${routeOffer?.pricePerTrip ?? '—'}
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
          })}
        </View>
      )}

      <View style={styles.sectionSpacing}>
        <Text style={styles.subtitle}>
          {localized('Required Documents')}:
        </Text>

        {checklistItems?.length ? (
          <FlatList
            data={checklistItems}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <Text style={styles.listItem}>• {item}</Text>
            )}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.infoText}>
            {localized('No required documents')}
          </Text>
        )}
      </View>

      <View style={styles.sectionSpacing}>
        <Text style={styles.subtitle}>
          {localized('Review Documents')}:
        </Text>

        <FinderReviewChecklist
          documents={submittedDocuments}
          request={request}
          onRefresh={refresh}
        />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.button}
          onPress={() =>
            onRequestDocuments(request.id, vendorData?.id, checklistItems)
          }
        >
          <Text style={styles.buttonText}>
            {localized('List Documents')}
          </Text>
        </Pressable>

        {isReadyForSignature ? (
          <Pressable style={styles.button} onPress={handleGoToSign}>
            <Text style={styles.buttonText}>
              {localized('Go to Sign')}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.button} onPress={onSendChecklist}>
            <Text style={styles.buttonText}>
              {localized('Send List')}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.button}
          onPress={onStartChat}
          disabled={!onStartChat}
        >
          <Text style={styles.buttonText}>
            {localized('Message Provider')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AcceptedOfferSection;