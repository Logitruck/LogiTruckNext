import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { setDestination, setOrigin } from '../../../../redux';
import { dynamicStyles } from './SearchModal.styles';
import PlaceRow from './PlaceRow';
import { useConfig } from '../../../../config';

const SearchModal = ({ navigation, route }: { navigation: any; route: any }) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const config = useConfig();

  const savingPlace = route?.params?.savingPlace;
  const updatingOrigin = route?.params?.updatingOrigin;
  const updatingDestination = route?.params?.updatingDestination ?? savingPlace;

  const dispatch = useDispatch();

  const currentUser = useSelector((state: any) => state.auth.user);
  const origin = useSelector((state: any) => state.trip.origin);
  const destination = useSelector((state: any) => state.trip.destination);

  const [predefinedPlaces, setPredefinedPlaces] = useState<any[] | undefined>();

  const isUpdatingRoute = updatingOrigin || updatingDestination;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerStyle: styles.navHeaderContainer,
    });
  }, [navigation, styles.navHeaderContainer]);

  useEffect(() => {
    const savedPlaces: any[] = [];

    (currentUser?.savedPlaces ?? []).forEach((savedPlace: any) => {
      const placeDescription = savedPlace.name ?? savedPlace.title;

      if (!placeDescription && !savedPlace.latitude) {
        return;
      }

      savedPlaces.push({
        description: placeDescription,
        geometry: {
          location: {
            lat: savedPlace.latitude,
            lng: savedPlace.longitude,
          },
        },
      });
    });

    setPredefinedPlaces(savedPlaces);
  }, [currentUser]);

  useEffect(() => {
    if (destination && origin && !isUpdatingRoute) {
      navigation.goBack();
    }
  }, [destination, origin, isUpdatingRoute, navigation]);

  const onSetDestination = (data: any, details: any) => {
    const geometry = details?.geometry;
    if (!geometry?.location) return;

    const {
      location: { lat: latitude, lng: longitude },
    } = geometry;

    const place = {
      latitude,
      longitude,
      title: data?.structured_formatting?.main_text ?? data?.vicinity,
      placeId: data?.place_id,
      subtitle: data?.structured_formatting?.secondary_text ?? '',
    };

    if (savingPlace) {
      navigation.navigate('SavePlace', { place });
      return;
    }

    dispatch(setDestination(place));
  };

  const onSetOrigin = (data: any, details: any) => {
    const geometry = details?.geometry;
    if (!geometry?.location) return;

    const {
      location: { lat: latitude, lng: longitude },
    } = geometry;

    const place = {
      latitude,
      longitude,
      title: data?.structured_formatting?.main_text ?? data?.vicinity,
      placeId: data?.place_id,
      subtitle: data?.structured_formatting?.secondary_text ?? '',
    };

    dispatch(setOrigin(place));
  };

  const generalAutoCompleteProps = {
    enablePoweredByContainer: false,
    suppressDefaultStyles: true,
    query: {
      key: config.googleMapsAPIKey,
      language: 'en',
    },
    fetchDetails: true,
    styles: {
      textInput: styles.textInput,
      textInputContainer: styles.textInputContainer,
      separator: styles.separator,
    },
    renderRow: (data: any) => <PlaceRow data={data} />,
    onFail: (error: any) =>
      console.error('GooglePlacesAutocomplete error:', error),
  };

  const routeAutoCompleteProps = {
    origin: {
      placeholder: localized('Where from'),
      onPress: onSetOrigin,
      currentLocation: true,
      currentLocationLabel: localized('Current location'),
      textInputProps: {
        autoFocus: true,
      },
      styles: {
        ...generalAutoCompleteProps.styles,
        container: styles.autocompleteContainer,
        listView: !updatingOrigin ? styles.listView : undefined,
      },
      renderDescription: (data: any) => data.description || data.vicinity,
      predefinedPlaces,
    },
    destination: {
      placeholder: savingPlace ? localized('Enter address') : localized('Where to?'),
      onPress: onSetDestination,
      textInputProps: {
        autoFocus: updatingDestination,
      },
      styles: {
        ...generalAutoCompleteProps.styles,
        container: {
          ...styles.autocompleteContainer,
          top: !updatingDestination ? 55 : 0,
        },
      },
    },
  };

  const renderGooglePlacesAutocomplete = (
    generalProps: any,
    specificProps: any
  ) => {
    if (!predefinedPlaces) return null;

    return <GooglePlacesAutocomplete {...generalProps} {...specificProps} />;
  };

  const renderLineIndicator = () => {
    if (!predefinedPlaces) return null;

    return (
      <>
        {!updatingDestination && (
          <View
            style={[styles.circle, origin?.title && styles.tintIndicator]}
          />
        )}

        {!isUpdatingRoute && <View style={styles.line} />}

        {!updatingOrigin && (
          <View
            style={[
              styles.square,
              destination?.title && styles.tintIndicator,
              updatingDestination && { top: 20 },
            ]}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {!updatingDestination &&
        renderGooglePlacesAutocomplete(
          generalAutoCompleteProps,
          routeAutoCompleteProps.origin
        )}

      {!updatingOrigin &&
        renderGooglePlacesAutocomplete(
          generalAutoCompleteProps,
          routeAutoCompleteProps.destination
        )}

      {renderLineIndicator()}
    </View>
  );
};

export default SearchModal;