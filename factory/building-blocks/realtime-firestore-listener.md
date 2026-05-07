# Building Block: Realtime Firestore Listener

## Pattern Summary

A React hook that attaches an `onSnapshot` listener to a Firestore collection or query, returns live data to the screen, and correctly cleans up the subscription on unmount or dependency change. This is the core read-data primitive across both LogiDriver and LogiTruckNet.

---

## Problem Being Solved

Screens need data that updates in real time without the screen polling Firestore. The `onSnapshot` API streams changes, but its subscription must be cancelled when the hook unmounts or when its key dependency (usually `userID` or `vendorID`) changes. Failure to cancel causes memory leaks, stale writes to unmounted components, and listener accumulation.

---

## Where This Pattern Appears in the Codebase

| File | Collection | Notes |
|---|---|---|
| `LogiDriver/src/driverapp/api/firebase/useOrders.js` | `VENDOR_DISPATCH/{vendorID}/vehicles/{vehicleID}/orders` | Canonical minimal form |
| `LogiDriver/src/driverapp/api/firebase/useTrucks.js` | `vendor_vehicles/{vendorID}/vehicles` | Two-effect hierarchy |
| `LogiTruckNet/src/features/requests/hooks/useRequestDetails.js` | `requests/{id}` + `vendor_requests/{vendorID}/requests/{id}` | Two parallel listeners |
| `LogiDriver/src/driverapp/api/firebase/useOrders.js` | — | Guard + subscribe + return unsub |

---

## Canonical Implementation

### Minimal form — single collection, synchronous path to document ref

```js
// LogiDriver/src/driverapp/api/firebase/useOrders.js (real pattern)
import { useState, useEffect } from 'react';
import { useConfig } from '../../../config';
import FirebaseOrderClient from './FirebaseOrderClient';

export const useOrders = (vendorID, vehicleID) => {
  const config = useConfig();
  const [orders, setOrders] = useState(null);   // null = loading, [] = empty

  useEffect(() => {
    if (!vendorID || !vehicleID) return;         // guard: no listener without IDs

    const unsubscribe = FirebaseOrderClient.subscribeToOrders(
      vendorID,
      vehicleID,
      config,
      (data) => setOrders(data),
    );

    return unsubscribe;                           // cleanup on unmount / dep change
  }, [vendorID, vehicleID]);

  return { orders };
};
```

**Key elements:**
- `useState(null)` — `null` is the loading sentinel; `[]` is confirmed empty
- Guard clause returns `undefined` (no-op cleanup) when IDs are missing
- Firebase client function owns the collection path; hook owns no path strings
- `useEffect` returns the unsubscribe function directly — no intermediate variable needed when the path is synchronous

---

### Multi-listener form — two parallel subscriptions

```js
// LogiTruckNet/src/features/requests/hooks/useRequestDetails.js (real pattern)
useEffect(() => {
  if (!requestID || !vendorID) return;

  const unsubRequest = FirebaseRequestClient.subscribeToRequest(
    requestID,
    (data) => setRequest(data),
  );

  const unsubVendorRequest = FirebaseRequestClient.subscribeToVendorRequest(
    vendorID, requestID,
    (data) => setVendorRequest(data),
  );

  return () => {
    unsubRequest();
    unsubVendorRequest();
  };
}, [requestID, vendorID]);
```

**Key elements:**
- Both listeners start synchronously; no async between them
- A combined cleanup function calls both unsubscribes
- Each listener writes to its own state variable (`setRequest` vs `setVendorRequest`)
- Merging is done at render time, not in the listener callback

---

### Async-lookup form — when the document ref requires a prior Firestore read

See `factory/knowledge/building-blocks/async-lookup-then-subscribe.md` for the full `ref + cancelled` pattern. The short version:

```js
useEffect(() => {
  if (!userID) return;
  let cancelled = false;
  let unsubscribe = () => {};

  const start = async () => {
    const vendorID = await lookupVendorID(userID);
    if (cancelled) return;
    unsubscribe = subscribeToCollection(vendorID, setData);
  };

  start();
  return () => {
    cancelled = true;
    unsubscribe();
  };
}, [userID]);
```

---

## Firebase Client Responsibilities

The hook delegates all Firestore path construction and query building to a `Firebase<Entity>Client.js` file:

```js
// FirebaseOrderClient.js
const subscribeToOrders = (vendorID, vehicleID, config, onData) => {
  const collection = config.FIREBASE_COLLECTIONS.VENDOR_DISPATCH;
  return firestore()
    .collection(collection)
    .doc(vendorID)
    .collection('vehicles')
    .doc(vehicleID)
    .collection('orders')
    .onSnapshot(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onData(data);
    });
};
```

The client returns the unsubscribe function directly from `onSnapshot`. The hook stores and returns it as cleanup.

---

## State Initialisation Conventions

| Initial value | Meaning | Usage |
|---|---|---|
| `null` | Loading — data not yet arrived | Show `<ActivityIndicator />` |
| `[]` | Confirmed empty from Firestore | Show empty state |
| `{}` or specific object | Confirmed empty object | Show empty state for single-doc hooks |

Screens check `if (data == null)` for loading, not `if (!data)` — because `[]` is falsy and would incorrectly trigger a loading state.

---

## Dependency Array Discipline

- Include every identifier the listener depends on (`vendorID`, `vehicleID`, `userID`, etc.)
- Do NOT include `config` unless the collection name is genuinely dynamic at runtime
- Do NOT include callbacks (`onData`) unless they are `useCallback`-memoised
- When the async-lookup path is used, every identifier used in both phases must be in the dependency array

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `useEffect(() => { subscribe(); }, [])` with no cleanup | Listener leaks on every remount |
| Returning from inside `.then()` chain | Unsubscribe goes to Promise scope, `useEffect` gets `undefined` |
| `setItems([...prev, ...newData])` inside a listener shared across IDs | Accumulates data across identity changes |
| Opening listener when `userID` is `null` or `undefined` | Fires on every app load before auth resolves |
| Calling `.get()` followed by `onSnapshot` on the same ref | Unnecessary double read; use `onSnapshot` only |
| Writing path strings inside the hook | Breaks collection registry governance |

---

## Testing Guidance

```
GIVEN userID is defined
WHEN the hook mounts
THEN an onSnapshot listener is registered on the correct collection path

GIVEN the hook is mounted with userID = 'A'
WHEN userID changes to 'B'
THEN the 'A' listener is cancelled and a new 'B' listener is opened

GIVEN onSnapshot fires with 3 documents
WHEN the callback executes
THEN the state contains exactly 3 items (no accumulation)

GIVEN the component unmounts
WHEN React calls the cleanup
THEN unsubscribe() is called and no further state updates are attempted
```

---

## Validation Commands

```bash
# Confirm no path strings leak into hooks
grep -r "collection(" LogiDriver/src --include="*.js" | grep -v "Client.js" | grep -v node_modules

# Confirm useEffect cleanup is present for every onSnapshot usage
grep -r "onSnapshot" LogiDriver/src --include="*.js" -l | grep -v node_modules
```

---

## Factory Governance

- Factory generates hooks and client functions into a `/tmp` clone only
- Claude Code reviews generated code against this spec before integration
- No generated hook may contain a Firestore path string — all paths go through config
- Every generated `useEffect` that opens a listener must return a cleanup function
- Async-lookup hooks must use the `ref + cancelled` pattern from `async-lookup-then-subscribe.md`
