import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../../../core/dopebase';
import { dynamicStyles } from './SearchCarrierScreen.styles';
import MenuIconButton from '../../../../core/components/buttons/MenuIconButton';
import SearchMap from '../../../components/search/SearchMap';
import BottomSheetScreen from '../bottomSheet/BottomSheetScreen';
import { setCarCategories } from  '../../../../redux';
import { tripsAPIManager } from '../../../services/tripsAPIManager';

const SearchCarrierScreen = () => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const [mapLoaded, setMapLoaded] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerTitleAlign: 'center',
      headerLeft: () => (
        <MenuIconButton
          onPress={() => navigation.openDrawer()}
          withShadow
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (mapLoaded) {
      fetchCarCategories();
    }
  }, [mapLoaded]);

  const fetchCarCategories = async () => {
    try {
      const categories = await tripsAPIManager.getCarCategories();
      dispatch(setCarCategories(categories));
    } catch (error) {
      console.warn('Error fetching car categories:', error);
    }
  };

  return (
    <View style={styles.container}>
      <SearchMap onMapReady={() => setMapLoaded(true)} />
      {mapLoaded && <BottomSheetScreen />}
    </View>
  );
};

export default SearchCarrierScreen;