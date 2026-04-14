import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Dimensions, FlatList } from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { useTheme, useTranslations } from '../../../../../core/dopebase';

import RideTypeItem from './RideTypeItem';
import {
  setbottomSheetSnapPoints,
  setSelectedRide,
  setSelectedRidePriceRange,
  setOrigin,
  setDestination,
} from '../../../../../redux';
import { dynamicStyles } from './RideTypesSheet.styles';

const screenHeight = Dimensions.get('window').height;
const FIXED_HEIGHT = screenHeight * 0.40;
const BOTTOM_CONTAINER_HEIGHT = 110;

const RideTypesSheet = ({ navigation }: { navigation: any }) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  const carCategories = useSelector(
    (state: any) => state.ride?.carCategories ?? [],
  );
  const dropoffETA = useSelector((state: any) => state.trip?.dropoffETA);
  const dropoffDistance = useSelector(
    (state: any) => state.trip?.dropoffDistance,
  );

  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (carCategories?.length > 0) {
      const firstItem = carCategories[0];
      dispatch(setSelectedRide(firstItem));
      setSelectedType(firstItem.id ?? firstItem.title ?? null);
    }
  }, [carCategories, dispatch]);

  useEffect(() => {
    if (isFocused) {
      dispatch(
        setbottomSheetSnapPoints({
          key: "ride_types",
          snapPoints: [FIXED_HEIGHT, FIXED_HEIGHT],
          index: 0,
        }),
      );
    }
  }, [dispatch, isFocused]);

  const onSelectRideType = (rideItem: any, priceRange?: any) => {
    setSelectedType(rideItem.id ?? rideItem.title ?? null);
    dispatch(setSelectedRide(rideItem));
    dispatch(setSelectedRidePriceRange(priceRange ?? null));
  };

  const handleChangeOriginDestination = () => {
    dispatch(setOrigin(null));
    dispatch(setDestination(null));
    navigation.navigate("HomeSheet");
  };

  const handleContinue = () => {
    const selectedRide = carCategories.find(
      (item: any) => (item.id ?? item.title) === selectedType,
    );

    if (selectedRide) {
      navigation.navigate("RideTypeDetailSheet", { ride: selectedRide });
    }
  };

  const contentContainerStyle = useMemo(
    () => ({
      ...styles.listContentContainer,
      paddingBottom: BOTTOM_CONTAINER_HEIGHT,
    }),
    [styles.listContentContainer],
  );

  const renderItem = ({ item }: { item: any }) => (
    <RideTypeItem
      dropoffETA={dropoffETA}
      dropoffDistance={dropoffDistance}
      item={item}
      isSelected={item.id === selectedType}
      onPress={onSelectRideType}
    />
  );

  return (
    <BottomSheetView style={[styles.container, { height: FIXED_HEIGHT }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleChangeOriginDestination}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>{localized("Back")}</Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          disabled={!selectedType}
          style={[styles.actionButton, !selectedType && styles.disabledButton]}
        >
          <Text style={styles.actionButtonText}>{localized("Continue")}</Text>
        </Pressable>
      </View>

      <FlatList
        data={carCategories}
        keyExtractor={(item: any, index: number) =>
          String(item.id ?? item.title ?? index)
        }
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetView>
  );
};

export default React.memo(RideTypesSheet);