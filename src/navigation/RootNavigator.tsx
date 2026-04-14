import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadScreen, WalkthroughScreen } from '../core/onboarding';
import LoginStack from './AuthStackNavigator';
import FinderRootNavigator from '../finder/navigation/FinderRootNavigator';
import CarrierRootNavigator from '../carrier/navigation/CarrierRootNavigator';
import DriverRootNavigator from '../driver/navigation/DriverRootNavigator';
import AdminStackNavigator from '../admin/navigation/AdminStackNavigator';
import { useAuth } from '../core/onboarding/hooks/useAuth';
import SelectVendorScreen from '../screens/auth/SelectVendorScreen';
import SelectRoleScreen from '../screens/auth/SelectRoleScreen';

const RootStack = createNativeStackNavigator();

const RootNavigator = () => {
  const {
    loading,
    authUser,
    currentUser,
    activeVendorID,
    activeRole,
    availableVendorIDs,
    availableRoles,
  } = useAuth();

  const hasMultipleVendors =
    Array.isArray(availableVendorIDs) && availableVendorIDs.length > 1;

  const hasMultipleRoles =
    Array.isArray(availableRoles) && availableRoles.length > 1;

  const requiresVendorContext = ['carrier', 'dispatch', 'driver', 'finder'].includes(
    activeRole || '',
  );

  const renderMainNavigator = () => {
    if (activeRole === 'admin' || activeRole === 'superadmin') {
      return AdminStackNavigator;
    }

    if (activeRole === 'carrier' || activeRole === 'dispatch' || activeRole === 'dispatcher') {
      return CarrierRootNavigator;
    }

    if (activeRole === 'driver') {
      return DriverRootNavigator;
    }

    if (activeRole === 'finder') {
      return FinderRootNavigator;
    }

    return LoginStack;
  };

  let ScreenComponent = LoadScreen;
  let screenName = 'LoadScreen';

  if (loading) {
    ScreenComponent = LoadScreen;
    screenName = 'LoadScreen';
  } else if (!authUser || !currentUser) {
    ScreenComponent = LoginStack;
    screenName = 'LoginStack';
  } else if (requiresVendorContext && !activeVendorID && hasMultipleVendors) {
    ScreenComponent = SelectVendorScreen;
    screenName = 'SelectVendorScreen';
  } else if (requiresVendorContext && !activeVendorID) {
    ScreenComponent = LoginStack;
    screenName = 'LoginStack';
  } else if (!activeRole && hasMultipleRoles) {
    ScreenComponent = SelectRoleScreen;
    screenName = 'SelectRoleScreen';
  } else if (!activeRole) {
    ScreenComponent = SelectRoleScreen;
    screenName = 'SelectRoleScreen';
  } else {
    ScreenComponent = renderMainNavigator();
    screenName = 'MainStack';
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <RootStack.Screen
        key={screenName}
        name={screenName}
        component={ScreenComponent}
      />
    </RootStack.Navigator>
  );
};

export default RootNavigator;