# Building Block: Hook–Service Pattern

**Version:** 1.0  
**Status:** canonical  
**Applies to:** LogiDriver · LogiTruckNet  
**Last verified against codebase:** 2026-05-06

---

## 1. Purpose

Defines the standard separation between **persistence** (Firebase client), **data access** (hook), and **presentation** (screen) used throughout the LogiTruck React Native apps. It codifies what the codebase already does in its cleanest examples and names the deviations that must be corrected when generating new code.

---

## 2. Problem Solved

Firestore `onSnapshot` listeners are stateful, asynchronous, and must be explicitly cleaned up. Without a clear boundary, screens accumulate Firebase logic, listener leaks appear when IDs change, and business logic becomes inseparable from render logic.

The pattern establishes three distinct layers so each can be tested, replaced, or extended independently.

---

## 3. When to Use

Use this pattern **every time** a screen needs to:
- Subscribe to a Firestore collection or document in real time
- Perform write mutations on Firestore
- Access data scoped to the current user's role (Driver / Dispatch / Finder / Carrier)

Do **not** apply it to:
- Pure navigation logic
- Local state (e.g., modal visibility, text input values)
- One-time reads that live entirely inside a mutation flow

---

## 4. Recommended Architecture Flow

```
Screen
  └─ useCurrentUser()        ← Redux selector (auth.user)
  └─ useConfig()             ← ConfigContext (collection names, API keys)
  └─ use<Entity>()           ← READ hook  (subscribes, returns data)
  └─ use<Entity>Mutations()  ← WRITE hook (returns action functions)
         │
         ▼
  Firebase<Entity>Client.js  ← Pure functions, zero state
         │
         ▼
  @react-native-firebase/firestore   ← SDK (React Native Firebase, NOT Web SDK)
         │
         ▼
  config.FIREBASE_COLLECTIONS.*     ← Collection names resolved at runtime
```

---

## 5. Real LogiTruck Examples Discovered in the Repo

### Read Hook + Firebase Client (canonical form)

`LogiDriver/src/driverapp/api/firebase/useOrders.js`
```js
const useOrders = (config, driverID) => {
  const [orders, setOrders] = useState()
  useEffect(() => {
    if (!driverID) return
    const unsub = subscribeToOrdersAPI(config, driverID, setOrders)
    return unsub                  // ← cleanup returned directly
  }, [driverID])
  return { orders }
}
```

`LogiDriver/src/driverapp/api/firebase/FirebaseOrderClient.js`
```js
export const subscribeToOrders = (config, driverID, callback) => {
  if (!driverID) return () => {}  // ← guard returns no-op
  return firestore()
    .collection(config.FIREBASE_COLLECTIONS.ORDERS)
    .where('driverID', '==', driverID)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => callback?.(snap.docs.map(doc => doc.data())),
      err  => console.log(err),
    )
}
```

### Mutation Hook (canonical form)

`LogiDriver/src/driverapp/api/firebase/useOrderMutations.js`  
Wraps `accept`, `markAsCompleted`, `markAsPickedUp`, `reject`, `onDelete` — all imported from `FirebaseOrderClient.js`. No `useState`, no `useEffect`. Config bound at instantiation time.

`LogiDriver/src/driverapp/api/firebase/useDriverRequestMutations.js`  
Same pattern: wraps `goOnline` / `goOffline` from `FirebaseDriverClient.js` and order actions.

### Screen consuming both read + mutation hooks (canonical form)

`LogiDriver/src/dispatchapp/screens/Home/HomeScreen.js`  
```js
const config      = useConfig()
const currentUser = useCurrentUser()
const { inProgressOrderID, orderRequest } = useDriverRequest(config, currentUser.id)
const { order }   = useInProgressOrder(config, inProgressOrderID)
const { accept, reject, goOffline, goOnline } = useDriverRequestMutations(config)
```
Screen performs zero Firestore calls. All data and actions come from hooks. Render is purely reactive.

### Newer self-contained feature module (preferred for new features)

`LogiTruckNet/src/features/requests/hooks/useMyRequest.js`  
Includes `loading` state, filters data by status in the hook, and exposes `{ activeRequests, historyRequests, loading }`.

`LogiTruckNet/src/features/requests/hooks/useRequestDetails.js`  
Manages **two parallel listeners** (`unsubscribeRequest` + `unsubscribeOffers`), returns both from cleanup:
```js
return () => {
  unsubscribeRequest()
  unsubscribeOffers()
}
```

`LogiTruckNet/src/features/requests/hooks/useCreateRequest.js`  
Mutation hook that uses a **model class** (`Request.js`) with a `toFirestore()` serializer before writing. Validates required fields in the constructor.

`LogiTruckNet/src/features/requests/models/Request.js`  
ES6 class with constructor validation + `toFirestore()` method. Throws on missing `origin.lat`, `rideType.id`, `createdBy.userID`.

### API barrel exports

`LogiDriver/src/driverapp/api/index.js`  
`LogiDriver/src/dispatchapp/api/index.js`  
Re-export all hooks so screens import from `'../../api'` not from specific firebase files.

---

## 6. Recommended Folder Structure

### For domain modules (driverapp / dispatchapp pattern)

```
{role}app/
  api/
    index.js                     ← barrel: re-exports all hooks
    firebase/
      Firebase<Entity>Client.js  ← pure Firestore functions
      use<Entity>.js             ← read hook
      use<Entity>Mutations.js    ← write hook
  screens/
    <FeatureName>/
      <FeatureName>Screen.js
      styles.js
  components/
    index.js
  data/
    *.json                       ← static reference data (checklist items, etc.)
```

### For feature modules (LogiTruckNet requests pattern — preferred for new features)

```
features/
  <featureName>/
    hooks/
      use<FeatureName>.js        ← read hook
      useCreate<FeatureName>.js  ← mutation hook
    models/
      <FeatureName>.js           ← ES6 class with toFirestore()
    screens/
      <ScreenName>/
        <ScreenName>Screen.js
        styles.js
      index.js
```

---

## 7. Hook Responsibilities

### Read Hook (`use<Entity>.js`)

- Owns `useState` + `useEffect`
- Guards against falsy IDs: `if (!id) return`
- Subscribes by calling the Firebase client function
- **Returns the unsubscribe function from `useEffect`** — not from a nested callback
- Named update handler: `const on<Entity>Update = data => setState(data)`
- Accepts identity parameters in dependency array: `[entityID]` or `[config, userID]`
- Returns a named destructurable object: `return { orders }`, `return { report }`, `return { activeRequests, historyRequests, loading }`
- Should expose `loading` state initialized to `true`, set to `false` in both success and error paths

### Mutation Hook (`use<Entity>Mutations.js`)

- **No `useState`**, **no `useEffect`**
- Wraps Firebase client functions, binding `config` as first argument
- Returns plain functions: `return { accept, reject, markAsCompleted }`
- Functions are synchronous wrappers — they return the Firebase promise
- Stateless: can be instantiated multiple times without side effects

---

## 8. Firebase Client Responsibilities

### File: `Firebase<Entity>Client.js`

- Pure functions only — no hooks, no state, no component coupling
- First parameter: `config` (receives `config.FIREBASE_COLLECTIONS.*`)
- Subscription functions return the `onSnapshot` unsubscribe function
- Guard clause returns `() => {}` (no-op) when required IDs are missing
- Callback is invoked with `callback?.(data)` — optional chaining
- Error handler uses `console.warn(error)` — **not `alert(error)`**
- Uses `@react-native-firebase/firestore` directly: `import firestore from '@react-native-firebase/firestore'`
- Timestamps: `firestore.FieldValue.serverTimestamp()` for writes, `firestore.Timestamp.fromDate()` for queries
- Multi-document writes that must be atomic: use `firestore().runTransaction()`

---

## 9. Screen Responsibilities

- Calls `useCurrentUser()` for the authenticated user (from `core/onboarding`)
- Calls `useConfig()` for Firestore collection names and app config
- Calls domain hooks — **never calls `firestore()` directly**
- Uses `useLayoutEffect` for header configuration (title, left/right buttons, colors)
- Loading state: when a hook returns `null` (initial state), renders `<ActivityIndicator />` or `<TNActivityIndicator />`
- Empty state: when a hook returns `[]`, renders `<EmptyStateView emptyStateConfig={...} />`
- Passes only primitive IDs to hooks (not whole objects), except when config is passed
- Does not filter, sort, or transform hook data — that belongs in the hook

---

## 10. Firestore Responsibilities

### Collection registry

All collection names live in `config.FIREBASE_COLLECTIONS` (defined in `LogiDriver/src/config/consumerAppConfig.js`):

```js
FIREBASE_COLLECTIONS: {
  USERS:               'users',
  ORDERS:              'restaurant_orders',
  VENDOR_VEHICLES:     'vendor_vehicles',
  VENDOR_DISPATCH:     'vendor_dispatch',
  TRUCK_INSPECTIONS:   'vehicle_inspections',
  CARRIER_INSPECTIONS: 'carriers_inspections',
  // ...
}
```

**Never hardcode collection names in hooks or clients.**  
Exception: `features/requests` hooks use hardcoded `'requests'` — this is a known inconsistency to fix.

### Access patterns by role

| Role     | Primary Firestore filter              | Lookup path                           |
|----------|---------------------------------------|---------------------------------------|
| Driver   | `.where('driverID', '==', driverID)`  | Direct — `currentUser.id` is driverID |
| Dispatch | Indirect — first fetch `vendorID` + `dispatchID` from `VENDOR_DISPATCH`, then subscribe | Two-step lookup |
| Finder   | `.where('createdBy.userID', '==', uid)` | Direct                              |
| Carrier  | `.doc(vendorID).collection('dispatchers').doc(dispatchID)` | Hierarchical |

---

## 11. Common Anti-Patterns Detected or to Avoid

### AP-1: Subscription leak in async two-step lookup
**Found in:** `useDispatchVehicles.js`, `useCarrierInspections.js`, `useTrucks.js`

```js
// WRONG — unsubscribe from subscribeToVehicles() is never returned
useEffect(() => {
  const fetchAndSubscribe = async () => {
    const id = await fetchSomeID()
    subscribeToVehicles(id)   // ← listener created, cleanup discarded
  }
  fetchAndSubscribe()
}, [userID])
```

**Correct pattern:** store unsubscribe in a ref and call it in the effect cleanup:
```js
useEffect(() => {
  let unsub = () => {}
  const run = async () => {
    const id = await fetchSomeID()
    unsub = subscribeToVehicles(id, onUpdate)
  }
  run()
  return () => unsub()
}, [userID])
```

### AP-2: Two Firebase import styles
`@react-native-firebase/firestore` imported directly **and** via `core/firebase/config`. Use the config re-export (`import { firestore } from '../../../core/firebase/config'`) in feature modules. Use direct import in driverapp/dispatchapp clients for backward compatibility.

### AP-3: `alert(error)` in Firebase client error handlers
**Found in:** `FirebaseOrderClient.js`, `FirebaseTrucksDriver.js`  
`alert()` blocks the UI thread. Replace with `console.warn()` or emit an error to the hook's `error` state.

### AP-4: Missing `loading` state in read hooks
Most driverapp hooks initialize state as `undefined` and rely on `null` checks in the screen. This is acceptable but fragile. New hooks should expose `loading: boolean`.

### AP-5: `this.config` reference inside exported function
**Found in:** `FirebaseOrderClient.js`, `reject` function  
```js
firestore().collection(this.config.FIREBASE_COLLECTIONS.USERS)  // ← runtime crash
```
All client functions are plain exports, not class methods. `this` is undefined in strict mode. Always use the `config` parameter directly.

### AP-6: Calling `useSelector(state => state.auth.user)` instead of `useCurrentUser()`
Both exist. `useCurrentUser()` is the canonical abstraction (`core/onboarding/hooks/useCurrentUser.js`). Use it. Direct `useSelector` calls bypass any future indirection layer.

### AP-7: No-op unsubscribe missing from client guard
Some clients return `undefined` when the guard triggers instead of `() => {}`.  
`useEffect` cleanup must always return a function or `undefined`. The client must return `() => {}`.

### AP-8: Barrel file incomplete
`driverapp/api/index.js` does not export `useInspections`. Screen imports it directly from the firebase path. All hooks must go through the barrel.

### AP-9: Commented-out dead code blocks
`FirebaseTrucksDriver.js` and `Firebasedispatch.js` have hundreds of lines of commented code. Factory-generated files must not include commented history.

---

## 12. Realtime Considerations

### Listener lifecycle
`onSnapshot` listeners are active as long as the component is mounted. They auto-reconnect on network recovery. The React `useEffect` cleanup is the only guaranteed teardown point.

### Dependency array discipline
Hook effects must depend only on the **identity** parameters (IDs, config). Avoid putting derived values or objects in the dep array — they cause listener restarts on every render.

```js
// CORRECT
useEffect(() => { /* subscribe */ }, [driverID])       // primitive ID

// WRONG — object reference changes every render
useEffect(() => { /* subscribe */ }, [currentUser])    // object reference
```

### Two-level subscriptions (hierarchical data)
When subscribing requires a preliminary async lookup (fetch vendorID → then subscribe), the lookup and subscription must share a single cleanup ref (see AP-1). The preliminary lookup does not need to be a separate `useEffect`.

### Multiple parallel listeners
`useRequestDetails.js` correctly manages two parallel listeners. Pattern: declare all `unsubscribe` vars, assign them in the effect body, return a combined cleanup:
```js
useEffect(() => {
  const u1 = subscribeA(...)
  const u2 = subscribeB(...)
  return () => { u1(); u2() }
}, [id])
```

### Avoiding stale closures
Named update handlers (`onOrdersUpdate`, `onTrucksUpdate`) should be defined before the `useEffect` or wrapped in `useCallback` if they depend on state. In the canonical driverapp pattern they are defined after the effect and captured via closure — this is acceptable because they only call `setState` with no other deps.

---

## 13. Testing Guidance

### What to test in Firebase clients
- Guard clause: calling with `undefined` ID returns no-op function, does not throw
- Callback is invoked with transformed data on snapshot
- Error callback does not throw

### What to test in read hooks
- Loading state: initial value before first snapshot
- When ID is `undefined`, no listener is created (verify via mock call count)
- When ID changes, old listener is unsubscribed and new one is created
- Data state reflects what the mock snapshot delivers

### What to test in mutation hooks
- Each returned function calls the corresponding Firebase client function
- Config is forwarded correctly (not mutated)

### What NOT to test in screens
Do not test Firestore logic in screen tests. Mock the hooks entirely:
```js
jest.mock('../../api', () => ({
  useOrders: () => ({ orders: mockOrders }),
  useOrderMutations: () => ({ accept: jest.fn() }),
}))
```

### Existing test infrastructure
As of May 2026, the project uses Jest with `@testing-library/react-native`. No Firebase emulator suite is configured. Hooks are currently tested via integration with real Firestore (staging project `development-69cdc`).

---

## 14. Validation Commands

```bash
# TypeScript check (from LogiTruckNext root)
npx tsc --noEmit

# Unit tests
npm test -- --passWithNoTests --watchAll=false

# Lint (if eslint is configured)
npx eslint src/ --ext .js,.ts,.tsx

# Verify no direct firestore() calls in screens
grep -rn "firestore()" src/screens src/driverapp/screens src/dispatchapp/screens \
  --include="*.js" --include="*.ts" --include="*.tsx"

# Verify all hooks exported from barrel
grep -n "export" src/driverapp/api/index.js
grep -n "export" src/dispatchapp/api/index.js
```

---

## 15. Example Lifecycle Flow

**Flow: Driver opens HomeScreen, receives a new order request**

```
1. App renders <HomeScreen>
2. useCurrentUser() → returns { id: 'driver-abc', isActive: true, ... } from Redux
3. useConfig() → returns config with FIREBASE_COLLECTIONS
4. useDriverRequest(config, 'driver-abc')
     → useEffect fires, calls subscribeToDriverAPI(config, 'driver-abc', onOrderRequestUpdate)
     → Firestore: users/driver-abc .onSnapshot()
5. (network) — Firestore delivers snapshot: { orderRequestData: { id: 'order-xyz', ... } }
6. onOrderRequestUpdate() → setUpdateDriverInfo(data)
7. Component re-renders: orderRequest is now { id: 'order-xyz', ... }
8. useInProgressOrder(config, inProgressOrderID)
     → inProgressOrderID is null initially → useEffect short-circuits
9. Screen renders <NewOrderRequestModal isVisible={true} />
10. Driver presses Accept → onAcceptNewOrder() → accept(orderRequest, currentUser)
     → calls acceptAPI(config, order, driver) in FirebaseOrderClient.js
     → writes to orders/order-xyz: { status: 'Driver Accepted', driver, driverID }
     → writes to users/driver-abc: { orderRequestData: null, inProgressOrderID: 'order-xyz' }
11. Firestore snapshot fires on users/driver-abc
12. useDriverRequest updates: orderRequest=null, inProgressOrderID='order-xyz'
13. useInProgressOrder(config, 'order-xyz') → new listener on orders/order-xyz
14. Screen re-renders with <OrderPreviewCard />
15. Driver navigates away → component unmounts
16. useEffect cleanups fire:
     - subscribeToDriverAPI unsubscribed
     - subscribeToInprogressOrderAPI unsubscribed
```

---

## 16. Risks and Scaling Concerns

| Risk | Current state | Mitigation |
|------|--------------|------------|
| **Listener leaks in async lookup hooks** | Active bug in `useDispatchVehicles`, `useCarrierInspections`, `useTrucks` | Fix with ref-based cleanup (AP-1) |
| **Collection name coupling** | `features/requests` hardcodes `'requests'` | Move to `config.FIREBASE_COLLECTIONS.REQUESTS` |
| **Config passed as arg vs hook** | driverapp passes `config` as arg; dispatchapp uses `useConfig()` inside hook | Standardize to `useConfig()` inside hook — no arg passing |
| **Duplicate hook implementations** | `driverapp/api/firebase/` and `dispatchapp/api/firebase/` have near-identical files | Refactor into `core/` with role-aware queries |
| **No error state exposed from hooks** | Read hooks return `undefined` data silently on error | Add `error` field to all hook return objects |
| **Loading detection via `null` initial state** | `if (orders == null) return <ActivityIndicator />` — fragile | Add explicit `loading: boolean` to all read hooks |
| **`alert()` in Firebase clients** | 3 instances in driverapp clients | Replace with proper error propagation |
| **Cross-role data access** | Dispatch hooks fetch vendorID from `VENDOR_DISPATCH` — coupling between user identity and tenant | Consider an auth context that resolves vendorID/dispatchID once at login |

---

## 17. Related Archetypes

| Archetype | Location | Relationship |
|-----------|---------|--------------|
| **Config Provider** | `LogiDriver/src/config/consumerAppConfig.js` | Provides all collection names and app config to hooks via context |
| **Auth Redux Slice** | `LogiDriver/src/core/onboarding/redux/auth.js` | Source of truth for `currentUser` — hooks and screens read from here |
| **dopebase UI** | `LogiDriver/src/core/dopebase` | Provides `useTheme`, `useTranslations`, `ActivityIndicator`, `EmptyStateView` |
| **Model classes** | `LogiTruckNet/src/features/requests/models/Request.js` | Encapsulate write-path validation and Firestore serialization |
| **API barrel** | `{role}app/api/index.js` | Single import surface for all domain hooks |
| **Firebase config re-export** | `LogiTruckNet/src/core/firebase/config.js` | Single import point for `firestore`, `auth`, `db`, `functions` |

---

## 18. Related Future Building Blocks

| Building Block | Purpose |
|----------------|---------|
| `role-aware-data-access.md` | How Driver, Dispatch, Finder, Carrier roles translate to different Firestore query paths and collection hierarchies |
| `async-lookup-then-subscribe.md` | Standard pattern for hooks that must resolve an indirect ID (vendorID, dispatchID) before subscribing — ref-based cleanup, race condition handling |
| `model-toFirestore-pattern.md` | When to use ES6 model classes vs plain objects for writes; validation conventions |
| `offline-sync-pattern.md` | AsyncStorage + NetInfo + Firestore write queue (currently implemented ad-hoc in `HomeDriverScreen`, `PreviewInspectionScreen`) |
| `mutation-optimistic-update.md` | Handling optimistic UI state when Firestore writes are pending |
| `collection-registry.md` | Canonical list of all Firestore collections, their schemas, and access rules by role |

---

## Factory Governance

> This building block is **reference material for code generation in the factory sandbox** (`/tmp/logitruck-{feature}/`).  
> Factory (Haiku) uses this document to generate structurally correct hook + client files.  
> **Claude Code** owns the final decision to integrate generated output into the real repository (`juanmorenoeu/LogiTruckNext`).  
> Factory never writes directly to the live repo. Integration requires human review of the generated files against this building block.

**Confidence level of patterns described:** Verified from source — all examples reference real files as of 2026-05-06.  
**Patterns marked as anti-patterns:** Verified present in the actual codebase.
