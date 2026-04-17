import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../core/dopebase';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import CarrierHeaderActions from '../components/Header/CarrierHeaderActions';
import ProjectsCarrierStack from '../../modules/projects/navigation/CarrierProjectsStackNavigator';

const Drawer = createDrawerNavigator();

const CarrierProjectsDrawerNavigator = () => {
  const config = useConfig();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();

  const colors = theme.colors[appearance];

  return (
    <Drawer.Navigator
      initialRouteName="ProjectsCarrierMain"
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
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: colors.primaryText,
          fontSize: 17,
          fontWeight: '600',
        },
        headerLeft: () => (
          <View style={{ width: 48, justifyContent: 'center' }}>
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
      navigation.navigate('SupportAssistant', {
        context: {
          role: 'carrier',
          module: 'projects',
          screen: 'ProjectsHome',
        },
      })
    }
  />
),
      })}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={
            config.drawerMenuConfig.carrierProjectsDrawerConfig.upperMenu
          }
          menuItemsSettings={
            config.drawerMenuConfig.carrierProjectsDrawerConfig.lowerMenu
          }
        />
      )}
    >
      <Drawer.Screen
        name="ProjectsCarrierMain"
        component={ProjectsCarrierStack}
        options={{
          headerTitle: localized('Projects'),
        }}
      />
    </Drawer.Navigator>
  );
};

export default CarrierProjectsDrawerNavigator;