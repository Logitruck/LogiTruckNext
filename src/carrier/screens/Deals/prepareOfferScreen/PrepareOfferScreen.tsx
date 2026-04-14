import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useSubmitOffer from '../../../hooks/useSubmitVendorOffer';

type RouteOfferDraftItem = {
  routeID: string;
  status: 'pending' | 'prepared' | 'not_offering';
  pricePerTrip: string;
  tripsOffered: string;
  notes: string;
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

const PrepareOfferScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { request, routeDrafts = [] } = route?.params || {};

  const routes = request?.routes || [];
  const submitOffer = useSubmitOffer();

  const [estimatedDays, setEstimatedDays] = useState('');
  const [availableTrucks, setAvailableTrucks] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: localized('Offer Summary'),
    });
  }, [navigation, localized]);

  const preparedRouteStates = useMemo(() => {
    return routeDrafts.filter((item: RouteOfferDraftItem) => item.status === 'prepared');
  }, [routeDrafts]);

  const notOfferingRoutes = useMemo(() => {
    return routeDrafts.filter((item: RouteOfferDraftItem) => item.status === 'not_offering');
  }, [routeDrafts]);

  const totalTrips = useMemo(() => {
    return preparedRouteStates.reduce((sum: number, item: RouteOfferDraftItem) => {
      return sum + Number(item.tripsOffered || 0);
    }, 0);
  }, [preparedRouteStates]);

  const totalPrice = useMemo(() => {
    const total = preparedRouteStates.reduce((sum: number, item: RouteOfferDraftItem) => {
      return sum + Number(item.pricePerTrip || 0) * Number(item.tripsOffered || 0);
    }, 0);

    return total.toFixed(2);
  }, [preparedRouteStates]);

  const handleSubmit = async () => {
    if (!request?.id) {
      Alert.alert(localized('Error'), localized('Request not found'));
      return;
    }

    if (!estimatedDays || !availableTrucks || !startDate) {
      Alert.alert(
        localized('Error'),
        localized('All general fields are required'),
      );
      return;
    }

    if (preparedRouteStates.length === 0) {
      Alert.alert(
        localized('Error'),
        localized('At least one route must be prepared'),
      );
      return;
    }

    try {
      setLoading(true);

      const routeOffers = preparedRouteStates.map((item: RouteOfferDraftItem) => ({
        routeID: item.routeID,
        pricePerTrip: Number(item.pricePerTrip),
        tripsOffered: Number(item.tripsOffered),
        notes: item.notes?.trim() || '',
      }));

      const matchedRoutes = routes.filter((currentRoute: any) =>
        preparedRouteStates.some(
          (item: RouteOfferDraftItem) => item.routeID === currentRoute.id,
        ),
      );

      await submitOffer({
        requestID: request.id,
        matchedRoutes,
        matchedRoutesCount: matchedRoutes.length,
        totalTrips,
        totalPrice: Number(totalPrice),
        estimatedDays: parseInt(estimatedDays, 10),
        availableTrucks: parseInt(availableTrucks, 10),
        estimatedStartDate: startDate,
        comment,
        routeOffers,
      });

      Alert.alert(
        localized('Success'),
        localized('Your offer has been submitted.'),
      );

      navigation.goBack();
    } catch (error: any) {
      console.error('Error submitting multiroute offer:', error);
      Alert.alert(
        localized('Error'),
        error?.message || localized('Submit failed'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>{localized('Offer Summary')}</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            {localized('Prepared routes')}: {preparedRouteStates.length}
          </Text>
          <Text style={styles.summaryText}>
            {localized('Not offering')}: {notOfferingRoutes.length}
          </Text>
          <Text style={styles.summaryText}>
            {localized('Trips offered')}: {totalTrips}
          </Text>
          <Text style={styles.summaryText}>
            {localized('Total Price')}: ${totalPrice}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{localized('Prepared Routes')}</Text>

        {preparedRouteStates.map((draft: RouteOfferDraftItem, index: number) => {
          const relatedRoute =
            routes.find((currentRoute: any) => currentRoute.id === draft.routeID) || null;

          return (
            <View key={draft.routeID || index} style={styles.routeBox}>
              <Text style={styles.routeTitle}>
                {relatedRoute
                  ? getRouteLabel(relatedRoute, localized, index)
                  : `${localized('Route')} ${index + 1}`}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('Price per trip')}: ${draft.pricePerTrip}
              </Text>

              <Text style={styles.routeMeta}>
                {localized('Trips offered')}: {draft.tripsOffered}
              </Text>

              {draft.notes ? (
                <Text style={styles.routeMeta}>
                  {localized('Notes')}: {draft.notes}
                </Text>
              ) : null}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>{localized('General Offer Details')}</Text>

        <Text style={styles.label}>{localized('Estimated Days')}</Text>
        <TextInput
          style={styles.input}
          placeholder={localized('Enter estimated days')}
          keyboardType="numeric"
          value={estimatedDays}
          onChangeText={setEstimatedDays}
          placeholderTextColor={theme.colors[appearance].secondaryText}
        />

        <Text style={styles.label}>{localized('Available Trucks')}</Text>
        <TextInput
          style={styles.input}
          placeholder={localized('Enter number of trucks')}
          keyboardType="numeric"
          value={availableTrucks}
          onChangeText={setAvailableTrucks}
          placeholderTextColor={theme.colors[appearance].secondaryText}
        />

        <Text style={styles.label}>{localized('Estimated Start Date')}</Text>
        <Pressable
          style={styles.dateInputContainer}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateInputText}>{startDate.toDateString()}</Text>
        </Pressable>

        {showDatePicker ? (
          <DateTimePicker
            mode="date"
            display={Platform.OS === 'ios' ? 'default' : 'default'}
            value={startDate}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) {
                setStartDate(date);
              }
            }}
          />
        ) : null}

        <Text style={styles.label}>{localized('Comments')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={localized('Optional comments')}
          multiline
          value={comment}
          onChangeText={setComment}
          placeholderTextColor={theme.colors[appearance].secondaryText}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
            style={styles.loader}
          />
        ) : (
          <Pressable style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>
              {localized('Submit Offer')}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

export default PrepareOfferScreen;