import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../core/dopebase';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import CarrierHeaderActions from '../components/Header/CarrierHeaderActions';
import CarrierJobsStackNavigator from './CarrierJobsStackNavigator';

const Drawer = createDrawerNavigator();

const CarrierJobsDrawerNavigator = () => {
  const config = useConfig();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();

  const colors = theme.colors[appearance];

  return (
    <Drawer.Navigator
      initialRouteName="CarrierJobsMain"
      screenOptions={({ navigation }) => ({
        headerShown: true,
        drawerStyle: {
          width: 300,
          backgroundColor: colors.primaryBackground,
        },
        headerStyle: {
          backgroundColor: colors.primaryBackground,
        },
        headerTintColor: colors.primaryText,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTitleStyle: {
          color: colors.primaryText,
          fontSize: 17,
          fontWeight: "600",
        },
        headerLeft: () => (
          <View style={{ width: 48, justifyContent: "center" }}>
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
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
        headerRight: () => (
          <CarrierHeaderActions
            showNotificationDot
            onAIPress={() =>
              navigation.navigate("SupportAssistant", {
                context: {
                  role: "carrier",
                  module: "jobs",
                  screen: "CarrierJobsHome",
                },
              })
            }
          />
        ),
      })}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.jobsDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.jobsDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen
        name="CarrierJobsMain"
        component={CarrierJobsStackNavigator}
        options={{
          headerTitle: localized("Jobs"),
        }}
      />
    </Drawer.Navigator>
  );
};

export default CarrierJobsDrawerNavigator;