import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions, Alert, Image } from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { AntDesign, Entypo, FontAwesome5 } from '@expo/vector-icons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './HomeSheet.styles';

// Ajusta estas rutas según dónde dejaste estas actions/services en la estructura nueva
import {
  setbottomSheetSnapPoints,
  setDestination,
  setUserData,
} from '../../../../../redux';

// import { updateUser } from '../../../../../core/users';

const screenHeight = Dimensions.get('window').height;
const FIXED_HEIGHT = screenHeight * 0.4;
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
  navigation.getParent()?.navigate('Search');
};

  const onPlacePress = (item: any) => {
    if (item.placeId) {
      dispatch(setDestination(item));
      navigation.navigate('RideTypesSheet');
      return;
    }

navigation.getParent()?.navigate('Search', { savingPlace: true });
  };

  const onConfirmRemove = async (index: number) => {
    const newSavedPlaces = [...savedPlaces];

    if (index === 0) {
      newSavedPlaces[0] = addPlace;
    } else {
      newSavedPlaces.splice(index, 1);
    }

    // await updateUser(currentUser.id, { savedPlaces: newSavedPlaces });

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
          {localized('Search for Available Carriers')}
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
        <Text style={styles.whereTitleText}>{localized('Where to?')}</Text>

        <View style={styles.searchContainer}>
          <Image
            source={theme.icons.search}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <Text style={styles.searchLabel}>{localized('Search')}</Text>
        </View>
      </Pressable>

      {savedPlaces.map(renderSavedPlace)}
    </BottomSheetView>
  );
};

export default React.memo(HomeSheet);