import React, { useLayoutEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';

// import NotificationsSection from '../../components/ManagerHome/NotificationsSections/NotificationsSection';
// import OffersSection from '../../components/ManagerHome/OffersSections/OffersSections';
// import InspectionsSection from '../../components/ManagerHome/InspectionsSections/InspectionsSections';
// import JobsSection from '../../components/ManagerHome/JobsSections/JobsSections';
// import QuickActionsSection from '../../components/ManagerHome/QuickActionsSections/QuickActionsSection';

const HomeScreen = () => {
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
          style={{ marginLeft: 16 }}
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
  }, [navigation, appearance, theme, localized]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* <NotificationsSection />

      <View style={styles.dashboardCardsContainer}>
        <OffersSection />
        <InspectionsSection />
      </View>

      <JobsSection />

      <QuickActionsSection /> */}
    </ScrollView>
  );
};

export default HomeScreen;