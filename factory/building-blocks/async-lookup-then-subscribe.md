# Building Block: Async Lookup → Realtime Subscription

**Version:** 1.0  
**Status:** canonical  
**Applies to:** LogiDriver · LogiTruckNet  
**Depends on:** `hook-service-pattern.md`  
**Last verified against codebase:** 2026-05-06

---

## 1. Purpose

Defines the canonical pattern for React hooks that must **resolve an indirect identifier asynchronously before creating a Firestore `onSnapshot` listener**. This is required whenever the data to subscribe to lives under a path that is not known at mount time — typically because the current user's identity in Firestore is stored under a tenant hierarchy (vendorID, dispatchID) that must be fetched first.

This building block documents four real memory-leak and data-corruption bugs currently active in the codebase, explains exactly how each failure mechanism works, and specifies the implementation contract all factory-generated hooks must follow.

---

## 2. The Operational Problem

### Why indirect lookup is necessary

Several Firestore collections in LogiTruck are not queryable by `userID` alone. The subscription path requires one or two additional IDs resolved at runtime:

| Hook | Lookup required | Reason |
|------|----------------|--------|
| `useDispatchVehicles` | `userID` → `vendorID` + `dispatchID` via `VENDOR_DISPATCH` | Vehicles live under `vendor_vehicles/{vendorID}/vehicles` |
| `useCarrierInspections` | `userID` → `vendorID` + `dispatchID` via `VENDOR_DISPATCH` | Inspections live under `carriers_inspections/{vendorID}/dispatchers/{dispatchID}/inspections` |
| `useTrucks` (driverapp) | `driverID` → `vendorID` via `users/{driverID}` | Trucks live under `vendor_vehicles/{vendorID}/vehicles` |
| `useInspectionsReport` | `truckID` → `lastInspectionID` via `vendor_trucks/{truckID}` | Inspection reports indexed by a truck-specific pointer |

None of these paths can be constructed from `currentUser.id` alone. The async lookup is structurally required.

### Why this creates a lifecycle problem

A synchronous `onSnapshot` listener is straightforward to clean up:

```js
useEffect(() => {
  const unsub = ref.onSnapshot(cb)
  return unsub           // React calls this on unmount / dep change
}, [id])
```

When the subscription creation is deferred to an async callback, the `useEffect` return slot executes **before** the listener is created. By the time `onSnapshot` is called, React has already captured the cleanup — which at that point is `undefined`.

---

## 3. Complete Bug Inventory — Real Codebase

### BUG-1: `useDispatchVehicles.js` — CRITICAL, active memory leak

**File:** `LogiDriver/src/dispatchapp/api/firebase/useDispatchVehicles.js`

```js
// Lines 9–54
useEffect(() => {
  if (!userID) return;

  const fetchDispatchID = async () => {
    const querySnapshot = await firestore()
      .collection(config.FIREBASE_COLLECTIONS.VENDOR_DISPATCH)
      .where('userID', '==', userID)
      .get();

    if (!querySnapshot.empty) {
      const { dispatchID, vendorID } = querySnapshot.docs[0].data();
      subscribeToVehicles(vendorID, dispatchID);  // ← (A) return value discarded
    }
  };

  const subscribeToVehicles = (vendorID, dispatchID) => {
    return ref.onSnapshot(snapshot => {            // ← (B) returns unsubscribe
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => { console.error(error); });
  };

  fetchDispatchID();    // ← (C) async, Promise<void> result discarded
  // useEffect returns undefined here — cleanup slot is empty
}, [config, userID]);
```

**Failure chain:**
1. `(B)` `subscribeToVehicles` correctly returns the `onSnapshot` unsubscribe function
2. `(A)` The call site inside `fetchDispatchID` does not `return` or store it
3. `(C)` `fetchDispatchID()` is called without `await`; the effect body exits synchronously
4. `useEffect` return value is `undefined` — React has nothing to call on cleanup

**Consequence:** Every time `userID` or `config` changes, a new listener is created and the previous one **survives indefinitely**. In a session where the user logs in, switches roles, or navigates back and forth, listeners accumulate. Each active listener fires on every Firestore write to that vehicle collection.

---

### BUG-2: `useCarrierInspections.js` — CRITICAL + DATA CORRUPTION, active

**File:** `LogiDriver/src/dispatchapp/api/firebase/useCarrierInspections.js`

**Leak mechanism** (identical structure to BUG-1):

```js
// Lines 9–89
useEffect(() => {
  if (!userID) return;

  const fetchVendorAndDispatchID = async () => {
    // ... get() call ...
    subscribeToInspections(vendorID, dispatchID); // ← (A) return value discarded
  };

  const subscribeToInspections = (vendorID, dispatchID) => {
    const unsubscribeApproved = approvedRef.onSnapshot(...);
    const unsubscribeRepair   = repairRef.onSnapshot(...);

    return () => {                                 // ← (B) cleanup correctly composed
      unsubscribeApproved();
      unsubscribeRepair();
    };
  };

  fetchVendorAndDispatchID();                     // ← (C) async, result discarded
  // useEffect returns undefined
}, [config, userID]);
```

`subscribeToInspections` internally creates two listeners and returns a combined cleanup — but this is discarded at `(A)`. **Both listeners survive forever.**

**Additional data-corruption bug — independent of the leak:**

The two snapshot handlers write to the same `inspections` state variable but with conflicting strategies:

```js
// approvedRef handler — line 67: REPLACES state
setInspections(approvedData);

// repairRef handler — line 77: APPENDS to current state
setInspections(prev => [...prev, ...repairData]);
```

Firestore delivers each snapshot independently. If `repairRef` fires first, the state becomes `repairData`. Then `approvedRef` fires and replaces the entire state with `approvedData` — repair records are gone. Then any Firestore write to the repair collection fires `repairRef` again, appending to the now-approved-only list. The displayed data oscillates between states on every write and is never a stable union of both sets.

---

### BUG-3: `subscribeToInspectionsReport` in `FirebaseInspectionsReport.js` — CRITICAL, triple failure

**File:** `LogiDriver/src/driverapp/api/firebase/FirebaseInspectionsReport.js`  
(identical copy in `LogiDriver/src/dispatchapp/api/firebase/FirebaseInspectionsReport.js`)

```js
// Lines 24–69
export const subscribeToInspectionsReport = (config, truckID, callback) => {
  if (!truckID) return () => {};

  const vendorTrucksRef = firestore()
    .collection(config.FIREBASE_COLLECTIONS.VENDOR_TRUCKS)
    .doc(truckID);

  vendorTrucksRef.get().then(vendorTruckDoc => {    // ← (A) Promise chain — fire and forget
    const lastInspectionID = vendorTruckDoc.data().lastInspectionID;

    return inspectionsRef.onSnapshot(               // ← (B) return is from .then() callback,
      snapshot => { callback?.({ ... }); },         //   NOT from subscribeToInspectionsReport
      error => { console.error(error); }
    );
  }).catch(error => { console.log(error); });

  // (C) Function returns here — synchronously — returning undefined
};
```

**Three distinct failures:**

1. **`(C)` — function returns `undefined` synchronously.** The `.get().then()` chain is started but the function exits before it resolves. There is no `return` statement at the outer scope.

2. **`(B)` — `return` is scoped to the `.then()` callback.** `return inspectionsRef.onSnapshot(...)` returns the unsubscribe function into the Promise chain — not to the caller of `subscribeToInspectionsReport`.

3. **Hook trusts the return value:** `useInspectionsReport.js` (both copies) does:
   ```js
   const unsubscribeToInspectionReports = subscribeToInspectionReportsAPI(config, reportID, cb)
   return unsubscribeToInspectionReports   // returns undefined from useEffect
   ```
   React receives `undefined` as the cleanup — the listener created inside the `.then()` **can never be unsubscribed**.

---

### BUG-4 (partial): `useTrucks.js` — stale async, subscription cleanup is correct

**File:** `LogiDriver/src/driverapp/api/firebase/useTrucks.js`  
(identical copy in `LogiDriver/src/dispatchapp/api/firebase/useTrucks.js`)

`useTrucks` splits the two phases into separate `useEffect` calls. The subscription effect (Effect 2) is **correct**:

```js
// Lines 37–53 — CORRECT
useEffect(() => {
  if (!vendorID || !driverID) return;
  const unsubscribeTruck = subscribeToTrucksAPI(config, vendorID, driverID, onTrucksUpdate);
  return () => { unsubscribeTruck?.(); };       // ← proper cleanup
}, [vendorID, driverID, config]);
```

Effect 1 (the async lookup) has two issues:

```js
// Lines 10–34
useEffect(() => {
  if (!driverID) return;

  const getUserVendorID = async () => {
    const userDoc = await firestore()...get();
    setVendorID(userData.vendorID);             // ← (A) no stale-async guard
  };

  getUserVendorID();                            // ← no cleanup returned
}, [driverID, config.FIREBASE_COLLECTIONS.USERS]);
//           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//           (B) object property in dep array
```

**`(A)` — Stale async:** If `driverID` changes while the `.get()` is in flight (e.g., user logs out and a new user logs in quickly), the old `getUserVendorID` completes and calls `setVendorID(oldVendorID)`. Effect 2 then subscribes with the wrong `vendorID`.

**`(B)` — Dep array coupling to config object:** `config.FIREBASE_COLLECTIONS.USERS` is a string property on an object from context. If the `ConfigContext` recreates its value object on re-render, this string reference changes identity, causing Effect 1 to re-run on every render even though `driverID` has not changed.

---

### CORRECT REFERENCE: `useRequestDetails.js` — no async lookup needed

**File:** `LogiTruckNet/src/features/requests/hooks/useRequestDetails.js`

```js
useEffect(() => {
  if (!requestID) return;

  const unsubscribeRequest = firestore()        // ← synchronous
    .collection('requests').doc(requestID)
    .onSnapshot(doc => { ... });

  const unsubscribeOffers = firestore()         // ← synchronous
    .collectionGroup('requests')
    .where('requestRef', '==', firestore().doc(`requests/${requestID}`))
    .onSnapshot(snapshot => { ...; setLoading(false); });

  return () => {                                // ← both cleaned up
    unsubscribeRequest();
    unsubscribeOffers();
  };
}, [requestID]);
```

Both paths are derivable from `requestID` synchronously, so no async lookup is needed. Both listeners are created and cleaned up in the same synchronous effect body. This is the **reference implementation for multi-listener cleanup**.

---

## 4. Canonical Cleanup Strategy

### The `ref + cancelled` pattern

The canonical solution for async lookup → subscribe uses a `let` variable initialized to a no-op, assigned after the async lookup completes, and a `cancelled` flag to guard against stale completions.

```js
useEffect(() => {
  if (!userID) return;

  let unsubscribe = () => {};   // (1) No-op until listener is created
  let cancelled = false;        // (2) Stale-async guard

  const run = async () => {
    try {
      const snapshot = await firestore()
        .collection(config.FIREBASE_COLLECTIONS.VENDOR_DISPATCH)
        .where('userID', '==', userID)
        .get();

      if (cancelled) return;    // (3) Check before creating listener

      if (snapshot.empty) {
        console.warn('[useXxx] No dispatch record found for userID:', userID);
        return;
      }

      const { vendorID, dispatchID } = snapshot.docs[0].data();

      unsubscribe = firestore()  // (4) Assign the real unsubscribe
        .collection(config.FIREBASE_COLLECTIONS.VENDOR_VEHICLES)
        .doc(vendorID)
        .collection('vehicles')
        .where('vendorDispatch.vendorDispatchID', '==', dispatchID)
        .onSnapshot(
          snap => setVehicles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
          err  => console.warn('[useXxx] subscription error:', err),
        );
    } catch (err) {
      if (!cancelled) console.warn('[useXxx] lookup error:', err);
    }
  };

  run();

  return () => {                // (5) Cleanup: cancel + unsubscribe
    cancelled = true;
    unsubscribe();
  };
}, [userID]);                   // (6) Only identity parameters
```

**Why each element is required:**

| Element | What it does | What breaks without it |
|---------|-------------|----------------------|
| `let unsubscribe = () => {}` | Holds the listener reference across the async gap | `unsubscribe()` in cleanup throws or is undefined |
| `let cancelled = false` | Prevents stale async from creating listeners after unmount | Listener created on unmounted component; `setState` called after cleanup |
| `if (cancelled) return` checked after `await` | Guards every async checkpoint | After unmount, the `await` resumes and creates a new live listener |
| `unsubscribe = ref.onSnapshot(...)` | Assigns the real cleanup at creation time | Cleanup still calls the no-op |
| `return () => { cancelled = true; unsubscribe() }` | Coordinates both teardown paths | Either the in-flight fetch completes and leaks, or the listener doesn't clean up |
| Minimal dep array `[userID]` | Effect only re-runs when the identifying parameter changes | Config object re-creation triggers infinite re-subscription |

---

## 5. Race Condition Risks

### RC-1: Component unmounts before lookup completes

```
t=0  useEffect fires, run() starts
t=1  .get() is awaited
t=2  Component unmounts, cleanup runs: cancelled=true, unsubscribe() (no-op)
t=3  .get() resolves, run() continues
t=4  if (cancelled) return  ← GUARDED — no listener created
```

**Without the guard:** Listener is created on an unmounted component. Every subsequent Firestore write triggers the callback, which calls `setState` on a dead component (React warning in dev, silent memory leak in prod).

### RC-2: `userID` changes before lookup completes

```
t=0  useEffect fires with userID='A', run() starts, .get() for A is awaited
t=1  userID changes to 'B', React re-runs effect:
       cleanup fires: cancelled=true, unsubscribe() (no-op for A)
       new effect fires with userID='B', run() starts, .get() for B awaited
t=2  .get() for A resolves
t=3  if (cancelled) return  ← GUARDED — A's listener is never created
t=4  .get() for B resolves, listener for B created correctly
```

**Without the guard (BUG-3):** A's listener is created with `vendorID_A`. B's listener is also created. Both fire. UI shows data for the wrong user plus the current user simultaneously.

### RC-3: Config object reference instability

```js
// WRONG — config.FIREBASE_COLLECTIONS is a new object reference on every ConfigProvider render
useEffect(() => { ... }, [driverID, config.FIREBASE_COLLECTIONS.USERS]);
```

If `ConfigProvider` creates its config value inline (not memoized), every re-render creates a new object, and `config.FIREBASE_COLLECTIONS.USERS` — despite being the same string value — is accessed from a new object instance. React compares dep array entries by reference, so `config` is "new" on every render and the effect re-fires continuously.

**Fix:** Depend only on primitive identity values:
```js
useEffect(() => { ... }, [userID]);
// config values are stable strings and need not be in the dep array
// if config itself must be a dep, memoize ConfigContext value with useMemo
```

---

## 6. Stale Subscription Risks

### SR-1: Listener accumulation (BUG-1, BUG-2)

Every dep change that triggers a new effect without cleaning up the previous listener results in N listeners running in parallel for the same data. Each listener independently calls `setState`, causing N re-renders on every Firestore write.

In a 10-minute session with 5 navigation events, this produces 5+ concurrent `onSnapshot` calls on the vehicles collection. Firestore bills per read operation — each snapshot delivery counts once per active listener.

### SR-2: Stale `vendorID` from intermediate state (BUG-4 partial)

In `useTrucks`, the lookup result is stored in React state (`setVendorID`). If the component re-renders between the `.get()` completing and `vendorID` being applied to the dep array of Effect 2, a window exists where Effect 2 uses the old vendorID for one render cycle. This is typically harmless but can cause a brief subscription to the wrong vendor's vehicles.

The `ref + cancelled` pattern avoids this by keeping the looked-up IDs as local variables, never touching state.

---

## 7. Dependency Array Discipline

### What belongs in the dep array

```js
// CORRECT — only the identity parameter that, when changed, should restart the subscription
useEffect(() => { ... }, [userID]);

// CORRECT — two identity parameters
useEffect(() => { ... }, [driverID, vendorID]);
```

### What does NOT belong in the dep array

```js
// WRONG — config is an object that may be recreated on every render
useEffect(() => { ... }, [config]);

// WRONG — object property access doesn't help; still compares the parent object
useEffect(() => { ... }, [config.FIREBASE_COLLECTIONS.USERS]);

// WRONG — callback functions recreated on every render
useEffect(() => { ... }, [onUpdate]);
```

### Rule for LogiTruck hooks

The dep array of the subscription effect must contain only:
1. The primary entity ID (e.g., `userID`, `driverID`, `reportID`)
2. Other scalar IDs that are direct inputs to the query path
3. Nothing derived from `config` (collection names are stable strings)
4. Nothing derived from callback functions

---

## 8. Multi-Listener Orchestration

When a single hook needs two parallel subscriptions (as in `useCarrierInspections`), the listeners must:

1. Be created in the same async run after the lookup completes
2. Write to **separate state variables** — never to the same variable with different merge strategies
3. Have their unsubscribes composed into a single cleanup

### Correct pattern for parallel listeners after async lookup

```js
const useCarrierInspections = (userID) => {
  const config = useConfig();
  const [approvedInspections, setApproved] = useState([]);  // (1) separate state
  const [repairInspections,   setRepair]   = useState([]);  // (1) separate state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userID) return;

    let unsubApproved = () => {};  // (2) individual no-ops
    let unsubRepair   = () => {};
    let cancelled     = false;

    const run = async () => {
      try {
        const snap = await firestore()
          .collection(config.FIREBASE_COLLECTIONS.VENDOR_DISPATCH)
          .where('userID', '==', userID)
          .get();

        if (cancelled || snap.empty) return;

        const { vendorID, dispatchID } = snap.docs[0].data();
        const basePath = firestore()
          .collection(config.FIREBASE_COLLECTIONS.CARRIER_INSPECTIONS)
          .doc(vendorID)
          .collection('dispatchers')
          .doc(dispatchID)
          .collection('inspections');

        unsubApproved = basePath          // (3) assign individually
          .where('statusReport', 'in', ['Approved', 'Approved by Mechanics'])
          .onSnapshot(
            s => { setApproved(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
            err => console.warn('[useCarrierInspections] approved:', err),
          );

        unsubRepair = basePath            // (3) assign individually
          .where('statusReport', '==', 'Send for Repair')
          .onSnapshot(
            s => setRepair(s.docs.map(d => ({ id: d.id, ...d.data() }))),
            err => console.warn('[useCarrierInspections] repair:', err),
          );
      } catch (err) {
        if (!cancelled) console.warn('[useCarrierInspections] lookup:', err);
      }
    };

    run();

    return () => {                        // (4) composed cleanup
      cancelled = true;
      unsubApproved();
      unsubRepair();
    };
  }, [userID]);

  return { approvedInspections, repairInspections, loading };
};
```

**Why separate state variables:** Each snapshot handler owns exactly one state variable. There is no merge strategy, no risk of one handler overwriting another's data, and no accumulated duplicates on re-fire.

**Merging for the screen:** If the screen needs a single list, it computes the union in the component body:

```js
const allInspections = useMemo(
  () => [...approvedInspections, ...repairInspections],
  [approvedInspections, repairInspections]
);
```

---

## 9. Async Effect Coordination — Complete Rules

These rules apply to any `useEffect` that contains an `async` function or a `.then()` chain:

| Rule | Rationale |
|------|-----------|
| Never return an async function directly from `useEffect` | React expects `undefined` or a synchronous cleanup function; `async () => {}` returns a Promise, not a function |
| Always declare `let unsubscribe = () => {}` before the async call | The closure captures it by reference; assignment inside the async body is visible to cleanup |
| Always declare `let cancelled = false` before the async call | Allows the cleanup to signal termination before the async body resumes |
| Always check `if (cancelled) return` immediately after each `await` | Every `await` is a preemption point where the component may have unmounted |
| Always assign `unsubscribe = ref.onSnapshot(...)` before yielding control again | Once assigned, cleanup will always call the real unsubscribe |
| Never call `setState` after `if (cancelled) return` | Prevents React `setState on unmounted component` warning |
| Never use `.then()` chains in Firebase client functions that are supposed to return an unsubscribe | The function returns before the chain resolves; the unsubscribe from `.then()` is unreachable |

---

## 10. Firebase Client Functions — Contract for Async Lookups

When the async lookup is encapsulated in a Firebase client function (as in `subscribeToInspectionsReport`), the function must be redesigned as an **async function that returns a Promise of an unsubscribe**. The hook manages the lifecycle.

**DO NOT do this in a Firebase client:**

```js
// WRONG — subscribeToInspectionsReport pattern
export const subscribeWithLookup = (config, id, callback) => {
  someRef.get().then(doc => {
    return anotherRef.onSnapshot(callback);  // this return goes nowhere
  });
  // returns undefined
};
```

**Instead, split responsibility:**

```js
// Firebase client — lookup only (async)
export const resolveInspectionPath = async (config, truckID) => {
  const doc = await firestore()
    .collection(config.FIREBASE_COLLECTIONS.VENDOR_TRUCKS)
    .doc(truckID)
    .get();
  if (!doc.exists) throw new Error(`Truck not found: ${truckID}`);
  const { lastInspectionID } = doc.data();
  if (!lastInspectionID) throw new Error(`No inspection for truck: ${truckID}`);
  return lastInspectionID;
};

// Firebase client — subscribe (synchronous, returns unsubscribe)
export const subscribeToInspectionReport = (config, inspectionID, callback) => {
  if (!inspectionID) return () => {};
  return firestore()
    .collection(config.FIREBASE_COLLECTIONS.TRUCK_INSPECTIONS)
    .where('reportId', '==', inspectionID)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => callback?.(snap.docs.map(doc => doc.data())),
      err  => console.warn('[subscribeToInspectionReport]', err),
    );
};
```

The hook then uses the `ref + cancelled` pattern to coordinate:

```js
// Hook
const useInspectionsReport = (truckID) => {
  const config = useConfig();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!truckID) return;

    let unsubscribe = () => {};
    let cancelled   = false;

    const run = async () => {
      try {
        const inspectionID = await resolveInspectionPath(config, truckID);
        if (cancelled) return;

        unsubscribe = subscribeToInspectionReport(config, inspectionID, data => {
          setReport(data);
          setLoading(false);
        });
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    };

    run();
    return () => { cancelled = true; unsubscribe(); };
  }, [truckID]);

  return { report, loading, error };
};
```

---

## 11. Realtime Scaling Concerns

| Concern | Impact | Mitigation |
|---------|--------|-----------|
| **Accumulating listeners per navigation** | N listeners fire on every Firestore write; N re-renders per change | `ref + cancelled` pattern guarantees exactly 1 active listener |
| **Firestore read billing** | Each active `onSnapshot` listener counts as a read on every delivered snapshot | Listener count must be bounded; one listener per hook instance |
| **Two parallel listeners on same subcollection** | Multiplied billing for overlapping status filters | Consider a single listener with client-side partition, or merge status filter into one compound query when Firestore `in` operator allows |
| **Config context re-creation** | Dep array instability causes continuous listener churn | Memoize `ConfigContext` value with `useMemo` in `ConfigProvider`; or extract collection names as stable constants |
| **Hierarchical path depth** | Each additional subcollection level requires an additional async lookup before subscribing | Cache resolved IDs at the session level (e.g., Redux) after first resolution; avoids redundant `.get()` calls across multiple hooks |

---

## 12. Pattern Classification Summary

| File | Pattern | Leak | Data corruption | Stale async | Fix required |
|------|---------|------|-----------------|-------------|--------------|
| `useDispatchVehicles.js` | async-in-effect, discard return | YES | No | No explicit guard | Full rewrite to `ref+cancelled` |
| `useCarrierInspections.js` | async-in-effect, discard return, shared state | YES | YES | No explicit guard | Full rewrite; separate state vars |
| `useTrucks.js` (both copies) | split `useEffect`, subscription cleanup correct | No | No | YES (Effect 1) | Add `cancelled` guard to Effect 1; fix dep array |
| `subscribeToInspectionsReport` (client) | `.then()` chain, returns undefined | YES | No | N/A | Split into `resolve` + `subscribe` |
| `useInspectionsReport` (hook) | trusts undefined return from client | YES | No | N/A | Fix client first, then apply `ref+cancelled` |
| `useRequestDetails.js` | synchronous multi-listener, correct cleanup | No | No | N/A | No fix needed — canonical reference |

---

## 13. Testing Guidance for This Pattern

### What to test

**Cleanup on unmount:**
```js
it('unsubscribes listener when component unmounts', async () => {
  const unsubMock = jest.fn();
  mockFirestore.onSnapshot.mockReturnValue(unsubMock);
  mockFirestore.get.mockResolvedValue(mockDispatchDoc);

  const { unmount } = renderHook(() => useDispatchVehicles('user-1'));
  await waitFor(() => expect(mockFirestore.onSnapshot).toHaveBeenCalled());
  unmount();
  expect(unsubMock).toHaveBeenCalledTimes(1);
});
```

**Stale async guard:**
```js
it('does not create listener if userID changes before lookup completes', async () => {
  let resolveLookup;
  mockFirestore.get.mockReturnValue(new Promise(r => { resolveLookup = r; }));

  const { rerender } = renderHook(({ id }) => useDispatchVehicles(id), {
    initialProps: { id: 'user-A' },
  });
  rerender({ id: 'user-B' });    // triggers cleanup before lookup resolves
  resolveLookup(mockDispatchDoc);

  await waitFor(() => {});
  expect(mockFirestore.onSnapshot).not.toHaveBeenCalledWith(
    expect.objectContaining({ userID: 'user-A' })
  );
});
```

**No listener created when userID is undefined:**
```js
it('creates no listener when userID is undefined', () => {
  renderHook(() => useDispatchVehicles(undefined));
  expect(mockFirestore.get).not.toHaveBeenCalled();
});
```

**No duplicate listeners on re-render:**
```js
it('does not create a second listener on re-render with same userID', async () => {
  mockFirestore.get.mockResolvedValue(mockDispatchDoc);
  const { rerender } = renderHook(() => useDispatchVehicles('user-1'));
  await waitFor(() => expect(mockFirestore.onSnapshot).toHaveBeenCalledTimes(1));
  rerender();
  expect(mockFirestore.onSnapshot).toHaveBeenCalledTimes(1);
});
```

---

## 14. Factory Rules — Requirements for Generated Hooks

All hooks generated by the factory that involve an async lookup before subscribing **MUST** implement the following. Non-compliance is a build-blocking defect.

```
✅ REQUIRED — `let unsubscribe = () => {}` declared before async call
✅ REQUIRED — `let cancelled = false` declared before async call  
✅ REQUIRED — `if (cancelled) return` checked immediately after every `await`
✅ REQUIRED — `unsubscribe = ref.onSnapshot(...)` assigned inside async body after all awaits
✅ REQUIRED — `return () => { cancelled = true; unsubscribe(); }` as the useEffect return
✅ REQUIRED — Dep array contains only scalar identity parameters (no config objects)
✅ REQUIRED — Separate state variables for each parallel listener
✅ REQUIRED — `loading: boolean` initial state `true`, set to `false` in first snapshot or error
✅ REQUIRED — `error: string | null` initial state `null`, set on catch

❌ FORBIDDEN — `async () => {}` as direct useEffect return value
❌ FORBIDDEN — calling subscribeX() inside an async function without storing the return value
❌ FORBIDDEN — `.then()` chains inside Firebase client functions that must return an unsubscribe
❌ FORBIDDEN — sharing a single state variable between two snapshot handlers with different merge strategies
❌ FORBIDDEN — `config` object or `config.FIREBASE_COLLECTIONS.*` in dependency arrays
❌ FORBIDDEN — `alert(error)` in any error handler
❌ FORBIDDEN — `console.log` debug traces in factory-generated code
```

---

## 15. Factory Governance

> This building block is **reference material for code generation in the factory sandbox** (`/tmp/logitruck-{feature}/`).  
> The canonical `ref + cancelled` pattern is the **required implementation** for any factory-generated hook that follows the async lookup → subscribe flow.  
> **Claude Code** validates generated hooks against this building block before integration into `juanmorenoeu/LogiTruckNext`.  
> The four bugs documented here (`BUG-1` through `BUG-4`) exist in the production repository and must not be replicated in any new hook. When the existing buggy hooks are refactored, this document serves as the specification for the corrected implementation.

**Confidence:** All code excerpts verified from source files as of 2026-05-06.  
**Active bugs status:** BUG-1, BUG-2, BUG-3 confirmed active. BUG-4 confirmed active (stale-async only; subscription cleanup is correct).
