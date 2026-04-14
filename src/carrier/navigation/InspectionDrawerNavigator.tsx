import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../../core/dopebase';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';

import InspectionsStackNavigator from './InspectionsStackNavigator';
// import MyProfileScreen from '../../screens/MyProfileScreen/MyProfileScreen';
import AddRepairExpenseScreen from '../../modules/vehicleExpenses/screens/AddRepairExpenseScreen/AddRepairExpenseScreen';
const Drawer = createDrawerNavigator();

const InspectionDrawerNavigator = () => {
  const config = useConfig();
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="Inspections"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.inspectionDrawerConfig.upperMenu}
          menuItemsSettings={
            config.drawerMenuConfig.inspectionDrawerConfig.lowerMenu
          }
        />
      )}
    >
      <Drawer.Screen name="Inspections" component={InspectionsStackNavigator} />
      <Drawer.Screen
        name="AddRepairExpense"
        component={AddRepairExpenseScreen}
        options={{
          title: "Add Repair",
          drawerItemStyle: { display: "none" },
        }}
      />
      {/* <Drawer.Screen
        name="MyProfileDrawer"
        component={MyProfileScreen} 
      />*/}
    </Drawer.Navigator>
  );
};

export default InspectionDrawerNavigator;