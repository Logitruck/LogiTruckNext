import React, { useLayoutEffect } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';

import FinderPriorityActionsSection from '../../../components/Home/FinderPriorityActionsSection/FinderPriorityActionsSection';
import FinderDealsOverviewSection from '../../../components/Home/FinderDealsOverviewSection/FinderDealsOverviewSection';
import FinderProjectsOverviewSection from '../../../components/Home/FinderProjectsOverviewSection/FinderProjectsOverviewSection';

const FinderHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Dashboard'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.headerMenuButton}
        >
          <MaterialCommunityIcons
            name="menu"
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [appearance, localized, navigation, styles, theme]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <FinderPriorityActionsSection />
      <FinderDealsOverviewSection />
      <FinderProjectsOverviewSection />
    </ScrollView>
  );
};

export default FinderHomeScreen;