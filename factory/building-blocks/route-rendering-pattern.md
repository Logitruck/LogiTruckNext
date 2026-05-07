# Building Block: Route Rendering Pattern

## Pattern Summary

Navigation trees are composed by nesting Stack, Drawer, and Bottom Tab navigators. The root navigator reads `currentUser.role` from Redux and conditionally renders the correct navigator tree per role. Auth screens live in their own isolated stack. Feature stacks compose inside Drawers, which compose inside Bottom Tabs.

---

## Problem Being Solved

LogiDriver serves four user roles (vendor, driver, admin, dispatcher) with completely different screen sets. LogiTruckNet serves finder and carrier roles. A single static navigation tree cannot serve all roles. The root navigator reads role from Redux and injects the correct sub-navigator, ensuring role-specific screens are never accessible to wrong roles.

---

## Where This Pattern Appears in the Codebase

| File | Navigator type | Role |
|---|---|---|
| `LogiDriver/src/navigators/RootNavigator.js` | Stack | Role-based conditional navigator selection |
| `LogiDriver/src/navigators/AuthStackNavigator.js` | Stack | Auth flow (Welcome → Login → Signup → SMS → Reset) |
| `LogiDriver/src/navigators/DriverStackNavigator.js` | Drawer + Bottom Tab + Stack | Driver role: inspections, orders, support |
| `LogiDriver/src/navigators/MainStackNavigator.js` | Bottom Tab + Drawer | Vendor/default role: Home, Friends, Profile |
| `LogiDriver/src/navigators/DispatchStackNavigator.js` | Drawer (assumed) | Dispatcher role |
| `LogiTruckNet/src/navigators/RootNavigator.js` | Stack | Single-role: Load → Auth → Main |

---

## Root Navigator — Role Branching

```js
// LogiDriver/src/navigators/RootNavigator.js
const RootNavigator = () => {
  const currentUser = useSelector(state => state.auth.user);

  return (
    <RootStack.Navigator
      initialRouteName="LoadScreen"
      screenOptions={{ headerShown: false, animationEnabled: false }}
    >
      {/* Always-accessible screens */}
      <RootStack.Screen name="LoadScreen" component={LoadScreen} />
      <RootStack.Screen name="Walkthrough" component={WalkthroughScreen} />
      <RootStack.Screen name="LoginStack" component={LoginStack} />

      {/* Role-conditional main stack */}
      {currentUser?.role === 'vendor' ? (
        <RootStack.Screen name="MainStack" component={MainStackNavigator} />
      ) : currentUser?.role === 'driver' ? (
        <RootStack.Screen name="MainStack" component={DriverDrawerStackNavigator} />
      ) : currentUser?.role === 'admin' ? (
        <RootStack.Screen name="MainStack" component={AdminStackNavigator} />
      ) : currentUser?.role === 'dispatcher' ? (
        <RootStack.Screen name="MainStack" component={DispatcherDrawerStack} />
      ) : (
        <RootStack.Screen name="MainStack" component={MainStackNavigator} />
      )}
    </RootStack.Navigator>
  );
};
```

**Key invariants:**
- `LoadScreen` is `initialRouteName` — always the first screen regardless of auth state
- `LoginStack` and `Walkthrough` are pre-auth, always registered
- All role variants share the same route name `"MainStack"` — navigation.navigate('MainStack') works for all roles
- Fallthrough case renders the default navigator (vendor/general)

---

## Auth Stack Pattern

```js
// LogiDriver/src/navigators/AuthStackNavigator.js
const AuthStackNavigator = () => {
  const { theme } = useTheme();
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerBackTitleVisible: false,
        cardStyle: theme.webContainerStyle,
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="Sms" component={SmsAuthenticationScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
};
```

Auth stack has `headerShown: false` globally at the navigator level, with individual screens re-enabling headers as needed via `options={{ headerStyle: styles.headerStyle }}`.

---

## Role Navigator Composition (Driver example)

```
DriverStackNavigator (Drawer)
  └── MainHome (Bottom Tab)
        ├── HomeScreen tab
        ├── LoadsScreen tab
        ├── Inspection tab
        └── Support tab
  └── PersonalChat (headerShown: true)
  └── SummaryInspection (headerShown: true)
  └── InspectionStack (headerShown: true)
  └── PreviewInspection (headerShown: true)
  └── ReportView (headerShown: true)
  └── MyProfileDrawer (headerShown: true)
```

Pattern: the Drawer wraps the Bottom Tab Navigator as the default screen. Screens that require a back button (detail screens) are registered directly on the Drawer with `headerShown: true`, not inside the Bottom Tab.

---

## Header Visibility Conventions

| Level | Setting | Why |
|---|---|---|
| Root navigator | `headerShown: false` | Root has no header |
| Drawer navigator | `headerShown: false` | Drawer slides over content |
| Bottom Tab navigator | Tab-specific via `options` | Headers per tab when needed |
| Stack inside tab | `headerMode: 'float'` | Floating header shared between screens |
| Detail screens (chat, inspection detail) | `headerShown: true` | Back button navigation |

---

## Config-Driven Drawer Menus

Drawer content reads menu items from `useConfig()`:

```js
// DriverStackNavigator.js
const config = useConfig();

<Drawer.Navigator
  drawerContent={({ navigation }) => (
    <IMDrawerMenu
      navigation={navigation}
      menuItems={config.drawerMenuConfig.driverDrawerConfig.upperMenu}
      menuItemsSettings={config.drawerMenuConfig.driverDrawerConfig.lowerMenu}
    />
  )}
>
```

Menu items are not hardcoded in the navigator — they come from the config registry so they can be modified without changing navigator files.

---

## Navigation from Screens

Screens always use hooks, never the navigation prop directly for tab/drawer control:

```js
// Correct — from useNavigation hook
const navigation = useNavigation();
navigation.navigate('RequestDetails', { requestID: req.id });
navigation.openDrawer();

// Acceptable — navigation prop for screens that receive it as a prop
const MyScreen = ({ navigation }) => {
  navigation.setOptions({ headerTitle: 'My Title' });
};
```

`navigation.setOptions(...)` is called inside `useLayoutEffect` (not `useEffect`) to avoid a flash of the old header:

```js
useLayoutEffect(() => {
  navigation.setOptions({
    headerTitle: localized('Home'),
    headerRight: () => <TouchableIcon ... />,
  });
}, []);
```

---

## Minimal RootNavigator for New App (no role branching)

```js
// LogiTruckNet/src/navigators/RootNavigator.js — simpler pattern
const RootNavigator = () => (
  <Root.Navigator
    initialRouteName="LoadScreen"
    screenOptions={{ headerShown: false, animationEnabled: false }}
  >
    <Root.Screen name="LoadScreen" component={LoadScreen} />
    <Root.Screen name="Walkthrough" component={WalkthroughScreen} />
    <Root.Screen name="LoginStack" component={LoginStack} />
    <Root.Screen name="MainStack" component={MainStackNavigator} />
  </Root.Navigator>
);
```

Use this form when there is only one post-auth navigator. Upgrade to the role-conditional form when a second role is introduced.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Checking `currentUser?.role` inside a screen to navigate | Navigation should be determined by the navigator tree, not by screens |
| Hardcoding drawer menu items in the navigator component | Use `config.drawerMenuConfig` |
| Using `navigation.navigate` to switch roles | Role change requires Redux state update → RootNavigator re-renders automatically |
| `useEffect` for `navigation.setOptions` | Causes flash of old header; use `useLayoutEffect` |
| Registering detail screens inside Bottom Tab | They won't show a back button; register them at Drawer or Stack level |
| Different route names per role for the same screen type | Use the same name ('MainStack') so auth redirects work universally |

---

## Testing Guidance

```
GIVEN currentUser.role = 'driver'
WHEN RootNavigator renders
THEN DriverDrawerStackNavigator is the 'MainStack' component

GIVEN currentUser.role = 'vendor'
WHEN RootNavigator renders
THEN MainStackNavigator (vendor) is the 'MainStack' component

GIVEN currentUser is null
WHEN RootNavigator renders
THEN only LoadScreen, Walkthrough, and LoginStack are registered (no MainStack)

GIVEN a screen calls navigation.navigate('MainStack')
WHEN currentUser.role = 'admin'
THEN AdminStackNavigator is rendered
```

---

## Factory Governance

- Factory generates navigator files into `/tmp` clone only
- New role navigators follow the Drawer + BottomTab + Stack nesting used in DriverStackNavigator
- Drawer content always uses `useConfig()` for menu items — no hardcoded arrays
- Role-conditional rendering is done via `currentUser?.role` from Redux `state.auth.user`
- Claude Code reviews and integrates navigator files — factory does not modify production navigators
