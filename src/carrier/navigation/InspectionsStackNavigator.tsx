import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../core/dopebase';
import CarrierHeaderActions from '../components/Header/CarrierHeaderActions';

import InspectionsHomeScreen from '../screens/Inspections/InspectionsHome/InspectionsHomeScreen';
import InspectionReportViewScreen from '../../modules/inspections/screens/ReportView/ReportViewScreen/ReportViewScreen';
import InspectionRepairScreen from '../screens/Inspections/InspectionRepair/InspectionRepairScreen';
import InspectionPreviewScreen from '../../modules/inspections/screens/PreviewInspectionScreen/PreviewInspectionScreen';

const Stack = createNativeStackNavigator();

const InspectionsStackNavigator = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const colors = theme.colors[appearance];

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="InspectionsHome"
        component={InspectionsHomeScreen}
        options={({ navigation }) => ({
          headerShown: true,
          headerTitle: localized('Inspections'),
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: colors.primaryBackground,
          },
          headerTintColor: colors.primaryText,
          headerShadowVisible: false,
          headerTitleStyle: {
            color: colors.primaryText,
            fontSize: 17,
            fontWeight: '600',
          },
          headerLeft: () => (
            <View style={{ width: 48, justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => (navigation.getParent() as any)?.openDrawer?.()}
                style={{ marginLeft: 18 }}
              >
                <MaterialCommunityIcons
                  name="menu"
                  size={24}
                  color={colors.primaryText}
                />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => <CarrierHeaderActions showNotificationDot />,
        })}
      />

      <Stack.Screen
        name="InspectionRepair"
        component={InspectionRepairScreen}
        options={{
          headerShown: true,
          title: localized('Inspection Repair'),
        }}
      />

      <Stack.Screen
        name="PreviewInspection"
        component={InspectionPreviewScreen}
        options={{
          headerShown: true,
          title: localized('Preview Inspection'),
        }}
      />

      <Stack.Screen
        name="ReportView"
        component={InspectionReportViewScreen}
        options={{
          headerShown: true,
          title: localized('Inspection Report'),
        }}
      />
    </Stack.Navigator>
  );
};

export default InspectionsStackNavigator;