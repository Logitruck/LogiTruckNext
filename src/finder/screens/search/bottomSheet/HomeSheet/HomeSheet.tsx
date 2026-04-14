import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { AntDesign, Entypo, FontAwesome5 } from '@expo/vector-icons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './HomeSheet.styles';

import {
  setbottomSheetSnapPoints,
  setDestination,
  setUserData,
  removeRouteFromPackage,
  resetTripState,
} from '../../../../../redux';

const screenHeight = Dimensions.get('window').height;
const FIXED_HEIGHT = screenHeight * 0.5;
const whereTitleBoxHeight = 74;

const HomeSheet = ({ navigation }: { navigation: any }) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const { bottom: safeBottomArea } = useSafeAreaInsets();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  const currentUser = useSelector((state: any) => state.auth.user);
  const origin = useSelector((state: any) => state.trip?.origin);
  const destination = useSelector((state: any) => state.trip?.destination);

  const requestRoutes = useSelector(
    (state: any) => state.finderRequestPackage?.routes || []
  );

  const addPlace = { name: localized('Enter New Address'), placeId: '' };
  const savedPlaces = currentUser?.savedPlaces ?? [addPlace];
  const hasRoute = origin && destination;

  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (hasRoute && isFocused) {
      navigation.navigate('RideTypesSheet');
    }
  }, [hasRoute, isFocused, navigation]);

  useEffect(() => {
    if (isFocused) {
      dispatch(
        setbottomSheetSnapPoints({
          key: 'homeSheet',
          snapPoints: [FIXED_HEIGHT, FIXED_HEIGHT],
          index: 1,
        })
      );
    }
  }, [dispatch, isFocused]);

  const onSearchLocation = () => {
    dispatch(resetTripState());
    navigation.getParent()?.navigate('Search');
  };

  const onPlacePress = (item: any) => {
    if (item.placeId) {
      dispatch(resetTripState());
      dispatch(setDestination(item));
      navigation.navigate('RideTypesSheet');
      return;
    }

    dispatch(resetTripState());
    navigation.getParent()?.navigate('Search', { savingPlace: true });
  };

  const onConfirmRemove = async (index: number) => {
    const newSavedPlaces = [...savedPlaces];

    if (index === 0) {
      newSavedPlaces[0] = addPlace;
    } else {
      newSavedPlaces.splice(index, 1);
    }

    dispatch(
      setUserData({
        user: {
          ...currentUser,
          savedPlaces: newSavedPlaces,
        },
      })
    );
  };

  const onPlaceLongPress = (item: any, index: number) => {
    if (!item.placeId) return;

    Alert.alert(
      localized('Confirm Delete'),
      localized(`Remove ${item.name ?? item.title} from saved place`),
      [
        {
          text: localized('Remove'),
          style: 'destructive',
          onPress: () => onConfirmRemove(index),
        },
        {
          text: localized('Cancel'),
        },
      ],
      { cancelable: false }
    );
  };

  const getIcon = (name?: string) => {
    const label = name?.toLowerCase() || '';
    const color = '#fff';

    if (label.includes('work')) {
      return <AntDesign name="clock-circle" size={20} color={color} />;
    }

    if (label.includes('home')) {
      return <Entypo name="home" size={20} color={color} />;
    }

    return <Entypo name="location-pin" size={20} color={color} />;
  };

  const renderSavedPlace = (item: any, index: number) => {
    const place = item?.title || item?.name ? item : addPlace;

    return (
      <Pressable
        key={`${index}`}
        onPress={() => onPlacePress(place)}
        onLongPress={() => onPlaceLongPress(place, index)}
        style={styles.locationItemContainer}
      >
        <View style={styles.iconContainer}>{getIcon(place.name)}</View>

        <View>
          <Text style={styles.destinationText}>{place.name ?? place.title}</Text>

          {place.subtitle && (
            <Text style={[styles.destinationText, styles.secondaryLocationText]}>
              {place.subtitle}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderRouteItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeCardContent}>
        <Text style={styles.routeCardTitle}>
          {item?.origin?.title || localized('Origin')} →{' '}
          {item?.destination?.title || localized('Destination')}
        </Text>

        <Text style={styles.routeCardSubtitle}>
          {localized('Trips')}: {item?.cargo?.trips || 0}
        </Text>
      </View>

      <Pressable
        onPress={() => dispatch(removeRouteFromPackage(item.id))}
        style={styles.routeDeleteButton}
      >
        <Entypo
          name="trash"
          size={18}
          color={theme.colors[appearance].danger}
        />
      </Pressable>
    </View>
  );

  return (
    <BottomSheetView
      style={[
        styles.container,
        {
          height: FIXED_HEIGHT,
          paddingBottom: Math.max(safeBottomArea, 12),
        },
      ]}
    >
      <View style={styles.headerTitleContainer}>
        <FontAwesome5
          name="truck"
          size={20}
          color={theme.colors[appearance].primaryText}
        />
        <Text style={styles.headerTitleText}>
          {localized('Search for Available Carriers ')}
        </Text>
      </View>

      <Pressable
        onPress={onSearchLocation}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.whereTitleBox,
          { height: whereTitleBoxHeight },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <Text style={styles.whereTitleText}>
          {requestRoutes.length > 0
            ? localized('Add another route')
            : localized('Where to?')}
        </Text>

        <View style={styles.searchContainer}>
          <Image
            source={theme.icons.search}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <Text style={styles.searchLabel}>{localized('Search')}</Text>
        </View>
      </Pressable>

      {requestRoutes.length > 0 ? (
        <>
          <Text style={styles.packageTitle}>
            {localized('Routes to quote')} ({requestRoutes.length})
          </Text>

          <FlatList
            data={requestRoutes}
            keyExtractor={(item: any) => item.id}
            renderItem={renderRouteItem}
            style={styles.routesList}
            scrollEnabled
          />

          <Pressable
            style={styles.reviewPackageButton}
            onPress={() => navigation.getParent()?.navigate('ReviewRequest')}
          >
            <Text style={styles.reviewPackageButtonText}>
              {localized('Review package')}
            </Text>
          </Pressable>
        </>
      ) : (
        savedPlaces.map(renderSavedPlace)
      )}
    </BottomSheetView>
  );
};

export default React.memo(HomeSheet);