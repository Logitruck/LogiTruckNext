# Building Block: Loading / Empty / Error State

## Pattern Summary

Three-state rendering pattern used across all list screens: a `null` sentinel for loading, an empty array for confirmed-empty, and a populated array for data-ready. Screens render `<ActivityIndicator>` for `null`, an empty-state message for `[]`, and the list for everything else.

---

## Problem Being Solved

Without a clear three-state model, screens cannot distinguish "Firestore hasn't responded yet" from "Firestore responded with nothing." Using a boolean `loading` flag alongside `items: []` works but requires tracking two variables that can go out of sync. The `null`-as-loading sentinel eliminates that race by making the initial state unambiguous.

---

## Where This Pattern Appears in the Codebase

| File | Pattern used |
|---|---|
| `LogiDriver/src/driverapp/screens/Orders/OrdersScreen.js` | `if (orders == null) return <ActivityIndicator />` — early return loading guard |
| `LogiTruckNet/src/features/requests/screens/MyRequest/MyRequestsScreen.js` | `loading` boolean from hook + `activeRequests.length > 0 ? list : emptyText` |
| `LogiDriver/src/driverapp/api/firebase/useOrders.js` | `useState(null)` as initial value |
| `LogiTruckNet/src/features/requests/hooks/useMyRequest.js` | Returns `{ activeRequests, historyRequests, loading }` |

---

## Variant 1: Null Sentinel (preferred for single-list screens)

```js
// Hook
const [orders, setOrders] = useState(null);  // null = loading

// Screen — OrdersScreen.js pattern
if (orders == null) {
  return <ActivityIndicator />;
}

if (orders.length === 0) {
  return <Text>{localized('No orders yet')}</Text>;
}

return (
  <FlatList
    data={orders}
    keyExtractor={item => item.id}
    renderItem={({ item }) => <OrderCard order={item} />}
  />
);
```

**When to use:** Single list per screen. The `null` check is the entire loading gate — no separate boolean.

---

## Variant 2: Loading Boolean (for multi-section screens)

```js
// Hook
const [activeRequests, setActiveRequests] = useState([]);
const [historyRequests, setHistoryRequests] = useState([]);
const [loading, setLoading] = useState(true);

// Screen — MyRequestsScreen.js pattern
<Text>{localized('Active Requests')}</Text>
{loading ? (
  <ActivityIndicator />
) : (
  activeRequests.length > 0
    ? activeRequests.map(req => <RequestCard key={req.id} request={req} />)
    : <Text>{localized('No active requests')}</Text>
)}

<Text>{localized('Request History')}</Text>
{loading ? null : (
  historyRequests.length > 0
    ? historyRequests.map(req => <RequestCard key={req.id} request={req} />)
    : <Text>{localized('No historical requests')}</Text>
)}
```

**When to use:** Multiple independent sections on a single screen where each can be empty independently. The loading boolean guards the entire screen; individual sections guard their own empty states.

Note: The History section renders `null` while loading instead of `<ActivityIndicator>` — a deliberate choice to avoid stacking two spinners. Match this pattern when adding multi-section screens.

---

## State Transitions

```
mount
  → null (loading)
    → Firestore callback fires with [] → [] (empty)
    → Firestore callback fires with data → [...] (data)
    → Error thrown → errorMessage set, items stays null or []
```

Do not transition from `null` to `[]` before the first Firestore callback fires. If Firestore never responds (offline, permission denied), the screen should show a loading or error state — not an empty state.

---

## Error State

The codebase's most common error pattern for screens is a conditional error message:

```js
const [error, setError] = useState(null);

// In hook, on catch:
setError(error.message || 'Something went wrong');

// In screen:
if (error) {
  return <Text style={styles.error}>{error}</Text>;
}
```

Because Firestore's `onSnapshot` does not throw on network loss (it continues streaming from cache), explicit error states are mainly for callable function failures and async mutation errors, not for subscription-based screens.

---

## Hook Return Shape

```js
// For single-list hooks (null-sentinel variant)
return { orders };            // orders: null | Order[]

// For multi-section hooks (loading-boolean variant)
return { activeRequests, historyRequests, loading };

// For hooks with mutation feedback
return { items, loading, error, clearError };
```

Do not return a separate `isEmpty` flag. Screens derive it from `items.length === 0`. Derived values that can be computed at render time should not be stored in hook state.

---

## Screen Render Order

1. Error check — if `error` is set, show error and bail
2. Loading check — if `null` (or `loading === true`), show `<ActivityIndicator>` and bail  
3. Empty check — if `[].length === 0`, show empty state
4. Data render — map over items

```js
if (error) return <ErrorView message={error} />;
if (items == null) return <ActivityIndicator />;
if (items.length === 0) return <EmptyState message={localized('Nothing here')} />;
return <ItemList items={items} />;
```

---

## Styling Conventions

Loading and empty states use the same `styles.container` layout as the data state — this prevents layout shift. The activity indicator is centered using `flex: 1, justifyContent: 'center', alignItems: 'center'` in the container style.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `useState([])` as initial list state | Loading and empty are indistinguishable |
| `if (!items)` instead of `if (items == null)` | `[]` is falsy, would treat empty as loading |
| Rendering spinner AND empty state simultaneously | UX contradiction |
| Showing partial data + spinner at the same time | Acceptable only for paginated lists with `loadingMore` flag |
| Setting error in the onSnapshot callback | `onSnapshot` does not error on network loss; use `onError` second arg if needed |
| Not resetting error state on new subscription start | Stale error persists after retry |

---

## Testing Guidance

```
GIVEN the hook is mounted and the first Firestore callback has not fired
WHEN the screen renders
THEN <ActivityIndicator> is visible and no list items are rendered

GIVEN Firestore returns an empty snapshot
WHEN the callback fires
THEN the empty state message is rendered and ActivityIndicator is gone

GIVEN Firestore returns 3 documents
WHEN the callback fires
THEN 3 list items are rendered and no spinner or empty state is visible

GIVEN a mutation throws
WHEN the error is set in hook state
THEN the screen renders the error message instead of the list
```

---

## Factory Governance

- Factory initialises list state as `null`, never `[]`, unless the `loading` boolean variant is explicitly chosen
- Factory generates the three-state check in the render order specified above (error → loading → empty → data)
- Factory does not invent a fourth state — there are only three
- Generated code placed in `/tmp` clone; Claude Code reviews before integration
