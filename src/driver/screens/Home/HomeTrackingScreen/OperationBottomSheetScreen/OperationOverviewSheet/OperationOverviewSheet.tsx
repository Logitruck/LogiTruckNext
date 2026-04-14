import React from 'react';
import {
  View,
  Text,
  Pressable,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { setOperationSheetData } from '../../../../../../redux';
import dynamicStyles from './OperationOverviewSheet.styles';

const OperationOverviewSheet = () => {
  const dispatch = useDispatch();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const {
    isPickupPhase,
    isCloseToDropoff,
    showArrivalPickupButton,
    showArrivalDropoffButton,
    currentStatusLabel,
    origin,
    destination,
    activeSummary,
    currentContactName,
    currentContactPhone,
    currentInstructions,
    onPrimaryActionType,
    requestedAction,
    showNavigateButton,
  } = useSelector((state: any) => state.operationSheet);

  const isPickupRelated =
    onPrimaryActionType === 'pickup_arrival' ||
    onPrimaryActionType === 'capture_pickup_ticket';

  const currentLat = isPickupRelated ? origin?.lat : destination?.lat;
  const currentLon = isPickupRelated ? origin?.lon : destination?.lon;
  const currentLabel = isPickupRelated
    ? origin?.title || localized('Pickup')
    : destination?.title || localized('Dropoff');

  const handleCallContact = async () => {
    if (!currentContactPhone) return;

    try {
      await Linking.openURL(`tel:${currentContactPhone}`);
    } catch (error) {
      console.log('❌ Error opening dialer:', error);
    }
  };

  const handleOpenNavigation = async () => {
    if (typeof currentLat !== 'number' || typeof currentLon !== 'number') {
      return;
    }

    const latLng = `${currentLat},${currentLon}`;
    const label = encodeURIComponent(currentLabel || 'Destination');

    const nativeUrl =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${latLng}&q=${label}`
        : `google.navigation:q=${latLng}`;

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLon}`;

    try {
      const supported = await Linking.canOpenURL(nativeUrl);

      if (supported) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      console.log('❌ Error opening navigation:', error);
    }
  };

  const nextActionLabel =
    onPrimaryActionType === 'pickup_arrival'
      ? localized('Arrived at Pickup')
      : onPrimaryActionType === 'capture_pickup_ticket'
      ? localized('Capture Pickup Ticket')
      : onPrimaryActionType === 'dropoff_arrival'
      ? localized('Arrived at Dropoff')
      : onPrimaryActionType === 'capture_dropoff_ticket'
      ? localized('Capture Delivery Ticket')
      : localized('Next Action');

  const nextActionDisabled =
    !onPrimaryActionType ||
    requestedAction === onPrimaryActionType ||
    (onPrimaryActionType === 'pickup_arrival' && !showArrivalPickupButton) ||
    (onPrimaryActionType === 'dropoff_arrival' && !showArrivalDropoffButton);

  const handlePrimaryAction = () => {
    if (nextActionDisabled || !onPrimaryActionType) return;

    dispatch(
      setOperationSheetData({
        requestedAction: onPrimaryActionType,
      }),
    );
  };

  const mainTitle = isPickupRelated
    ? origin?.title || localized('Pickup')
    : destination?.title || localized('Dropoff');

  const mainSubtitle = isPickupRelated
    ? origin?.address || '—'
    : destination?.address || '—';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sheetTopRow}>
          <Text style={styles.statusPill}>
            {currentStatusLabel ||
              (isPickupPhase
                ? localized('Heading to Pickup')
                : localized('Heading to Dropoff'))}
          </Text>

          <Text style={styles.etaMini}>
            {activeSummary?.durationMinutes ?? '—'} min
          </Text>
        </View>

        <View style={styles.topActionsRow}>
          {showNavigateButton ? (
            <Pressable
              style={styles.navigateButton}
              onPress={handleOpenNavigation}
            >
              <Text style={styles.navigateButtonText}>
                {localized('Navigate')}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[
              styles.nextActionButton,
              nextActionDisabled && styles.nextActionButtonDisabled,
              !showNavigateButton && styles.nextActionButtonFull,
            ]}
            disabled={nextActionDisabled}
            onPress={handlePrimaryAction}
          >
            <Text
              style={[
                styles.nextActionButtonText,
                nextActionDisabled && styles.nextActionButtonDisabledText,
              ]}
            >
              {nextActionLabel}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.mainDestinationTitle}>{mainTitle}</Text>

        <Text style={styles.mainDestinationSubtitle}>{mainSubtitle}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillLabel}>{localized('Distance')}</Text>
            <Text style={styles.metricPillValue}>
              {activeSummary?.distanceMiles ?? '—'} mi
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={styles.metricPillLabel}>{localized('ETA')}</Text>
            <Text style={styles.metricPillValue}>
              {activeSummary?.durationMinutes ?? '—'} min
            </Text>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>{localized('Contact')}</Text>
          <Text style={styles.contactName}>{currentContactName || '—'}</Text>
          <Text style={styles.contactPhone}>{currentContactPhone || '—'}</Text>

          {!!currentContactPhone && (
            <Pressable style={styles.callButton} onPress={handleCallContact}>
              <Text style={styles.callButtonText}>
                {localized('Call Contact')}
              </Text>
            </Pressable>
          )}
        </View>

        {!!currentInstructions && (
          <View style={styles.instructionsCard}>
            <Text style={styles.sectionTitle}>{localized('Instructions')}</Text>
            <Text style={styles.instructionsText}>{currentInstructions}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default React.memo(OperationOverviewSheet);