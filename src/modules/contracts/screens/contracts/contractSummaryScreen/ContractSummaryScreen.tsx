import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './contractStyles';

import useAcceptedOfferDetails from '../../../hooks/useContractDetails';
import ChecklistSection from '../../../../../core/components/checkList/ChecklistSection';
import DocumentAssociationModal from '../../../../../carrier/components/contract/DocumentAssociationModal';
import useSubmitContract from '../../../../../carrier/hooks/useSubmitContract';
import useChecklistDocumentActions from '../../../../../carrier/hooks/useChecklistDocumentActions';

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

  return `${originTitle} → ${destinationTitle}`;
};

const ContractSummaryScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { request, offer } = route?.params || {};

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAcceptedRoutes, setShowAcceptedRoutes] = useState(false);

  const {
    checklistItems,
    submittedDocuments,
    loading,
    refresh,
  } = useAcceptedOfferDetails(request);

  const submitContract = useSubmitContract();

  const {
    viewDocument,
    removeDocument,
    sendDocument,
    replaceDocument,
  } = useChecklistDocumentActions(request, refresh, localized);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Contract Summary'),
      headerBackTitleVisible: false,
    });
  }, [navigation, localized]);

  const acceptedRoutes = useMemo(() => {
    return offer.matchedRoutes;
  }, [offer]);

  const summary = useMemo(() => {
    return {
      totalRoutes: acceptedRoutes.length,
      totalTrips: offer.offer.totalTrips,
      totalPrice: offer.offer.totalPrice,
      estimatedDays: offer.offer.estimatedDays,
      availableTrucks: offer.offer.availableTrucks,
      startDate: acceptedRoutes[0]?.cargo?.startDate,
      comment: offer.offer.comment || '',
    };
  }, [acceptedRoutes, offer]);

  if (!request || !offer || loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      </View>
    );
  }

  const handleAddDocument = (section: string) => {
    setSelectedSection(section);
    setModalVisible(true);
  };

  const handleSubmitApproval = async () => {
    if (!submittedDocuments?.length) {
      Alert.alert(
        localized('Missing Documents'),
        localized('Please upload documents before submitting.'),
      );
      return;
    }

    const groupedDocsBySection = checklistItems.map((section: string) => {
      const docsInSection = submittedDocuments.filter(
        (doc: any) => doc.checklistItemLabel === section,
      );

      const hasValidDoc =
        docsInSection.length > 0 &&
        !docsInSection.some((doc: any) => doc.status === 'rejected');

      return { section, valid: hasValidDoc };
    });

    const incompleteSections = groupedDocsBySection
      .filter(({ valid }: { valid: boolean }) => !valid)
      .map(({ section }: { section: string }) => section);

    if (incompleteSections.length > 0) {
      Alert.alert(
        localized('Incomplete Checklist'),
        `${localized('The following sections are missing valid documents')}:\n${incompleteSections.join(', ')}`,
      );
      return;
    }

    try {
      setSubmitting(true);
      await submitContract(request.id);

      Alert.alert(
        localized('Success'),
        localized('Contract marked as ready'),
      );

      navigation.goBack();
    } catch (error) {
      console.error('Error updating contract status:', error);
      Alert.alert(
        localized('Error'),
        localized('Failed to submit contract'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasChecklist = Array.isArray(checklistItems) && checklistItems.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{localized('Contract Summary')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{localized('Accepted Package')}</Text>

          <Text style={styles.cardText}>
            {localized('Accepted routes')}: {summary.totalRoutes}
          </Text>

          <Text style={styles.cardText}>
            {localized('Trips')}: {summary.totalTrips}
          </Text>

          <Text style={styles.cardText}>
            {localized('Accepted Offer')}: ${summary.totalPrice}
          </Text>

          <Text style={styles.cardText}>
            {localized('Estimated Days')}: {summary.estimatedDays}
          </Text>

          <Text style={styles.cardText}>
            {localized('Available Trucks')}: {summary.availableTrucks}
          </Text>

          <Text style={styles.cardText}>
            {localized('Start Date')}: {formatDate(summary.startDate)}
          </Text>

          {summary.comment ? (
            <Text style={styles.cardText}>
              {localized('Comment')}: {summary.comment}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Pressable
            style={styles.routesHeaderRow}
            onPress={() => setShowAcceptedRoutes((prev) => !prev)}
          >
            <Text style={styles.cardTitle}>{localized('Accepted Routes')}</Text>
            <Text style={styles.routesToggleText}>
              {showAcceptedRoutes
                ? localized('Hide details')
                : localized('Show details')}
            </Text>
          </Pressable>

          {showAcceptedRoutes ? (
            acceptedRoutes.map((currentRoute: any, index: number) => {
              const relatedRouteOffer = offer.offer.routeOffers.find(
                (routeOffer: any) => routeOffer.routeID === currentRoute.id,
              );

              return (
                <View key={currentRoute.id || index} style={styles.routeBox}>
                  <Text style={styles.routeTitle}>
                    {getRouteLabel(currentRoute, localized, index)}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Trips')}: {currentRoute?.cargo?.trips ?? '—'}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Daily Trips')}: {currentRoute?.cargo?.dailyTrips ?? '—'}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Start Date')}: {formatDate(currentRoute?.cargo?.startDate)}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('End Date')}: {formatDate(currentRoute?.cargo?.endDate)}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Distance')}: {currentRoute?.routeSummary?.distanceMiles ?? '—'} mi
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Duration')}: {currentRoute?.routeSummary?.durationMinutes ?? '—'} min
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Price per trip')}: ${relatedRouteOffer?.pricePerTrip ?? '—'}
                  </Text>

                  <Text style={styles.routeMeta}>
                    {localized('Trips offered')}: {relatedRouteOffer?.tripsOffered ?? '—'}
                  </Text>

                  {relatedRouteOffer?.notes ? (
                    <Text style={styles.routeMeta}>
                      {localized('Notes')}: {relatedRouteOffer.notes}
                    </Text>
                  ) : null}
                </View>
              );
            })
          ) : null}
        </View>

        {hasChecklist ? (
          checklistItems.map((sectionTitle: string) => (
            <ChecklistSection
              key={sectionTitle}
              sectionTitle={sectionTitle}
              documents={submittedDocuments?.filter(
                (doc: any) => doc.checklistItemLabel === sectionTitle,
              )}
              onAddDocument={() => handleAddDocument(sectionTitle)}
              onViewDocument={viewDocument}
              onRemoveDocument={removeDocument}
              onSendDocument={sendDocument}
              onReplaceDocument={replaceDocument}
            />
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              {localized(
                'No checklist has been assigned yet. Please wait for the finder to define the required documents.',
              )}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {hasChecklist ? (
        <View style={styles.bottomButtonContainer}>
          <Pressable
            style={styles.button}
            onPress={handleSubmitApproval}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting
                ? localized('Submitting...')
                : localized('Submit for Approval')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.bottomButtonContainer}>
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateText}>
              {localized('No checklist has been created yet for this contract.')}
            </Text>
          </View>
        </View>
      )}

      <DocumentAssociationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        requestID={request.id}
        checklistItem={selectedSection}
        onAssociationComplete={() => {
          setModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

export default ContractSummaryScreen;