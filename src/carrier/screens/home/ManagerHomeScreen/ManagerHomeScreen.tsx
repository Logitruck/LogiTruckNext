import React, { useLayoutEffect } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';

// import OperationsSummaryHeader from '../../../components/ManagerHome/OperationsSummary/OperationsSummaryHeader';
import PriorityActionsSection from '../../../components/ManagerHome/PriorityActions/PriorityActionsSection';
import LiveOperationsSection from '../../../components/ManagerHome/LiveOperations/LiveOperationsSection';
import DealsOverviewSection from '../../../components/ManagerHome/DealsOverview/DealsOverviewSection';
import InspectionsOverviewSection from '../../../components/ManagerHome/InspectionsOverview/InspectionsOverviewSection';
import JobsOverviewSection from '../../../components/ManagerHome/JobsOverview/JobsOverviewSection';
import ActivityFeedSection from '../../../components/ManagerHome/ActivityFeed/ActivityFeedSection';
import QuickActionsSection from '../../../components/ManagerHome/QuickActions/QuickActionsSection';

const ManagerHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  // useLayoutEffect(() => {
  //   const colors = theme.colors[appearance];

  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: localized('Operations Dashboard'),
  //     headerLeft: () => (
  //       <TouchableOpacity
  //         onPress={() => navigation.openDrawer()}
  //         style={styles.headerMenuButton}
  //       >
  //         <MaterialCommunityIcons
  //           name="menu"
  //           size={24}
  //           color={colors.primaryText}
  //         />
  //       </TouchableOpacity>
  //     ),
  //     headerStyle: {
  //       backgroundColor: colors.primaryBackground,
  //     },
  //     headerTintColor: colors.primaryText,
  //   });
  // }, [appearance, localized, navigation, styles, theme]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* <OperationsSummaryHeader /> */}

      <PriorityActionsSection />

      <LiveOperationsSection />

      <DealsOverviewSection />

      <InspectionsOverviewSection />

      <JobsOverviewSection />

      <ActivityFeedSection />

      <QuickActionsSection />
    </ScrollView>
  );
};

export default ManagerHomeScreen;