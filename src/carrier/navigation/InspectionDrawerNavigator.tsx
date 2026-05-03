import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import InspectionsStackNavigator from './InspectionsStackNavigator';
import AddRepairExpenseScreen from '../../modules/vehicleExpenses/screens/AddRepairExpenseScreen/AddRepairExpenseScreen';

const Drawer = createDrawerNavigator();

const InspectionDrawerNavigator = () => {
  const config = useConfig();

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
      <Drawer.Screen
        name="Inspections"
        component={InspectionsStackNavigator}
      />

      <Drawer.Screen
        name="AddRepairExpense"
        component={AddRepairExpenseScreen}
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
};

export default InspectionDrawerNavigator;