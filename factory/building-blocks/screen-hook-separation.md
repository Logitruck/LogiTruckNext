# Building Block: Screen–Hook Separation

## Pattern Summary

Screens are pure composition surfaces. They call hooks to get data and mutations, pass props to components, and handle navigation. They contain no Firestore calls, no business logic, and no async operations. All data work lives in hooks; all persistence work lives in Firebase clients.

---

## Problem Being Solved

Without a clear boundary, screens accumulate Firestore calls, inline fetch logic, and data transformation. This makes screens hard to test, hard to reuse, and fragile when collection paths change. The three-layer separation (screen → hook → client) keeps each layer focused and independently testable.

---

## Where This Pattern Appears in the Codebase

| File | Role | Notes |
|---|---|---|
| `LogiDriver/src/dispatchapp/screens/Home/HomeScreen.js` | Screen | Canonical: `useCurrentUser` + `useConfig` + domain hooks, zero Firestore |
| `LogiDriver/src/driverapp/screens/Orders/OrdersScreen.js` | Screen | `orders == null` loading guard, list rendering only |
| `LogiTruckNet/src/features/requests/screens/MyRequest/MyRequestsScreen.js` | Screen | `loading` + `activeRequests` + `historyRequests` from one hook |
| `LogiDriver/src/driverapp/api/firebase/useOrders.js` | Hook | Owns subscription lifecycle, returns `{ orders }` |
| `LogiDriver/src/driverapp/api/firebase/useOrderMutations.js` | Mutation hook | No state, no effects, returns action callbacks only |
| `LogiDriver/src/driverapp/api/firebase/FirebaseOrderClient.js` | Client | Pure Firestore functions, no React |

---

## Canonical Screen Structure

```js
// Pattern observed in HomeScreen.js and MyRequestsScreen.js
const MyFeatureScreen = () => {
  // 1. System hooks — theme, i18n, navigation
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const navigation = useNavigation();
  const styles = dynamicStyles(theme, appearance);

  // 2. Auth — always from Redux, never Firestore
  const currentUserID = useSelector(state => state.auth.user?.id);

  // 3. Domain hooks — data and mutations
  const { items, loading } = useItems(currentUserID);
  const { createItem, deleteItem } = useItemMutations();

  // 4. Local UI state only
  const [isModalVisible, setModalVisible] = useState(false);

  // 5. Handlers — navigation and mutation calls only
  const handleItemPress = (item) => {
    navigation.navigate('ItemDetails', { itemID: item.id });
  };

  const handleCreate = () => {
    createItem({ ... });
  };

  // 6. Render — loading / empty / data states
  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      {items.length > 0
        ? items.map(item => <ItemCard key={item.id} item={item} onPress={handleItemPress} />)
        : <Text>{localized('No items')}</Text>
      }
    </View>
  );
};
```

---

## Canonical Read Hook Structure

```js
// Pattern from useOrders.js, useTrucks.js
export const useItems = (ownerID) => {
  const config = useConfig();
  const [items, setItems] = useState(null);  // null = loading

  useEffect(() => {
    if (!ownerID) return;
    const unsubscribe = FirebaseItemClient.subscribeToItems(ownerID, config, setItems);
    return unsubscribe;
  }, [ownerID]);

  return { items };
};
```

---

## Canonical Mutation Hook Structure

```js
// Pattern from useOrderMutations.js — no state, no effects
export const useItemMutations = () => {
  const config = useConfig();

  const createItem = useCallback(async (payload) => {
    return FirebaseItemClient.createItem(payload, config);
  }, [config]);

  const deleteItem = useCallback(async (itemID) => {
    return FirebaseItemClient.deleteItem(itemID, config);
  }, [config]);

  return { createItem, deleteItem };
};
```

---

## Layer Responsibilities

### Screen layer
- Calls hooks and passes results to components as props
- Handles navigation (`navigation.navigate`, `navigation.goBack`)
- Manages local UI state (modal visibility, input focus, selected tab)
- Applies theme styles
- Never imports `firestore()`, `collection()`, or any Firebase SDK directly

### Hook layer
- Owns subscription lifecycle (`useEffect` + cleanup)
- Owns loading/error state
- Calls `useConfig()` to get collection registry
- Calls `useCurrentUser()` or `useSelector` for auth context
- Delegates path construction and queries to Firebase clients
- Never contains JSX or navigation calls

### Firebase client layer
- Pure functions — no React, no hooks, no state
- Constructs Firestore paths using the config registry
- Returns `onSnapshot` unsubscribe functions from subscribe functions
- Returns `Promise` from mutation functions
- Barrel-exported from `api/index.js`

---

## Config and Auth Access Patterns

```js
// Auth — always Redux selector, never Firestore
const currentUser = useSelector(state => state.auth.user);
const currentUserID = useSelector(state => state.auth.user?.id);

// Config — always useConfig(), never hardcoded collection names
const config = useConfig();
const collection = config.FIREBASE_COLLECTIONS.VENDOR_DISPATCH;
```

`useCurrentUser()` in `LogiDriver/src/core/onboarding/hooks/useCurrentUser.js` is a convenience wrapper:
```js
export const useCurrentUser = () => useSelector(state => state.auth.user);
```

---

## Barrel Export Pattern

All hooks are re-exported from `api/index.js`:

```js
// api/index.js
export { useOrders } from './firebase/useOrders';
export { useOrderMutations } from './firebase/useOrderMutations';
export { useTrucks } from './firebase/useTrucks';
```

Screens import from the barrel, never from individual hook files:
```js
import { useOrders, useOrderMutations } from '../../api';
```

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `firestore().collection(...)` inside a screen | Bypasses the client layer; paths become scattered |
| `useState` + `useEffect` + Firestore inside a screen | Screen becomes untestable and unswappable |
| Business logic (filtering, mapping, sorting) inside a screen | Belongs in hook or model layer |
| Mutation logic (write, update, delete) directly in screen event handlers | Belongs in mutation hook |
| `useCurrentUser` called inside a `useEffect` or async function | Hook rules violation; call at component top level |
| Passing navigation object into a hook | Navigation belongs to screen layer |
| Importing a Firebase client directly in a screen | Always go through the hook layer |

---

## Testing Guidance

```
GIVEN a screen under test
WHEN rendered with mock hook return values
THEN the screen renders the expected list items without any Firestore dependency

GIVEN a hook under test
WHEN ownerID is provided
THEN the hook opens a subscription via the client and returns items

GIVEN a mutation hook
WHEN createItem is called
THEN FirebaseItemClient.createItem is called with the correct payload

GIVEN ownerID changes
WHEN the hook re-runs
THEN the previous subscription is cleaned up before the new one starts
```

---

## Factory Governance

- Factory generates screen, hook, and client as three separate files
- Screen file contains zero Firebase imports
- Hook file contains zero JSX
- Client file contains zero React imports
- Collection path strings exist only in client files, always sourced from `config.FIREBASE_COLLECTIONS`
- Generated code is placed in `/tmp` clone and reviewed by Claude Code before integration
