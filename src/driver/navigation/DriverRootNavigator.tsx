import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../../core/dopebase';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import { useConfig } from '../../config';

import DriverEntryNavigator from './DriverEntryNavigator';
import DriverTabs from './DriverTabs';
import DriverChatStackNavigator from './DriverChatStackNavigator';
// import DriverActiveJobStack from './DriverActiveJobStack';

// import IMChatScreen from '../../chat/IMChatScreen/IMChatScreen';
// import MyProfileScreen from '../../chat/IMChatScreen/IMChatScreen';
// import AssistantScreenScreen from '../../chat/IMChatScreen/IMChatScreen';
import AddFuelExpenseScreen from '../../modules/vehicleExpenses/screens/AddFuelExpenseScreen/AddFuelExpenseScreen';

const Drawer = createDrawerNavigator();

const HeaderRightActions = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <View style={{ flexDirection: 'row', marginRight: 12 }}>
      <TouchableOpacity
        style={{ paddingHorizontal: 8 }}
        onPress={() => navigation.navigate('DriverChatStack')}
      >
        <MaterialCommunityIcons
          name="chat-outline"
          size={22}
          color={colors.primaryText}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={{ paddingHorizontal: 8 }}
        onPress={() => navigation.navigate('Support')}
      >
        <MaterialCommunityIcons
          name="help-circle-outline"
          size={22}
          color={colors.primaryText}
        />
      </TouchableOpacity>
    </View>
  );
};

const DriverRootNavigator = () => {
  const config = useConfig();
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primaryBackground,
        },
        headerTintColor: colors.primaryText,
        headerRight: () => <HeaderRightActions />,
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.driverDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.homeDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen
        name="DriverEntry"
        component={DriverEntryNavigator}
        options={{ headerShown: false }}
      />

      <Drawer.Screen
        name="DriverMainTabs"
        component={DriverTabs}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="DriverChatStack"
        component={DriverChatStackNavigator}
        options={{
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />

      {/* <Drawer.Screen
        name="DriverActiveJobStack"
        component={DriverActiveJobStack}
        options={{ headerShown: false }}
      />

      <Drawer.Screen name="PersonalChat" component={IMChatScreen} />
      <Drawer.Screen
        name="Support"
        component={AssistantScreenScreen}
        options={{ title: "Support" }}
      />
      <Drawer.Screen name="MyProfile" component={MyProfileScreen} /> */}

      <Drawer.Screen
        name="AddFuelExpense"
        component={AddFuelExpenseScreen}
        options={{
          title: "Add Fuel",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer.Navigator>
  );
};

export default DriverRootNavigator;