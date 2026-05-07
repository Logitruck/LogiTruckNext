# Building Block: Event-Driven Orchestration

## Pattern Summary

Cloud Functions react to Firestore document writes and orchestrate downstream operations: fan-out writes, status propagation, batch updates, push notifications, and projection maintenance. The trigger function reads `before`/`after` data, decides what changed, and executes a sequence of atomic writes. A sentinel field (`updatedByFunction: true`) prevents trigger re-entry.

---

## Problem Being Solved

Business workflows span multiple Firestore collections (request, vendor_requests, project, project_channel). No single client write can atomically update all of them. Cloud Functions provide the coordination layer: when one document changes, the function ensures all derived collections stay consistent.

---

## Where This Pattern Appears in the Codebase

| File | Trigger | What it orchestrates |
|---|---|---|
| `LogiFunctionsV2/functions/distributeRequest/distributeRequest.js` | `onDocumentCreated('requests/{requestID}')` | Geo+category matching → fan-out to `vendor_requests/{vendorID}/requests/{requestID}` + push notifications |
| `LogiFunctionsV2/functions/deels/onRequestUpdated.js` | `onDocumentUpdated('requests/{requestID}')` | Status machine switch → cascading batch updates across `requests`, `vendor_requests`, `project_channels`, `projects` |
| `LogiFunctionsV2/functions/inspections/inspections.js` | `onDocumentCreated/Updated('vendor_vehicles/.../inspections/{id}')` | Projection → vehicle summary, dispatcher summary, status history |
| `LogiFunctionsV2/functions/dispatch/dispatchv2.js` | `onDocumentUpdated` on inspections | Activates pending jobs when inspection is approved |

---

## Trigger Entry Points

```js
// v2 syntax — both apps use firebase-functions/v2/firestore
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');

exports.onRequestCreated = onDocumentCreated(
  'requests/{requestID}',
  async (event) => {
    const requestID = event.params.requestID;
    const data = event.data?.data();
    if (!data) return;
    // orchestration logic
  }
);

exports.onRequestUpdated = onDocumentUpdated(
  'requests/{requestID}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const requestID = event.params.requestID;
    if (!before || !after) return;
    // orchestration logic
  }
);
```

**Data access:**
- Created event: `event.data?.data()` for the new document
- Updated event: `event.data?.before.data()` and `event.data?.after.data()`
- Path params: `event.params.{wildcard}`

---

## Status Machine Pattern (onRequestUpdated)

The `onRequestUpdated.js` function implements the trip request status machine via a `switch` on `newStatus`:

```js
const previousStatus = before.status;
const newStatus = after.status;

if (previousStatus !== newStatus) {
  switch (newStatus) {
    case 'cancelled':
      // collectionGroup query → batch cancel all vendor_requests
      break;
    case 'accepted':
      // close competing vendor offers, advance contract_status
      break;
    case 'to_sign':
      // propagate to_sign to vendor_request
      break;
    case 'signed':
      // advance to 'execution', create project + project_channel
      break;
    default:
      logger.info(`No action for status: ${newStatus}`);
  }
}
```

A second block handles `contract_status` changes independently:

```js
if (prevContractStatus !== newContractStatus) {
  const updateMap = {
    sent_list: 'send_documents',
    review_documents: 'review_documents',
    request_changes: 'review_changes',
  };
  const vendorNewStatus = updateMap[newContractStatus];
  if (vendorNewStatus) {
    await vendorRequestRef.update({ contract_status: vendorNewStatus, ... });
  }
}
```

Always check `previousValue !== newValue` before acting. Without this guard, every Firestore write (even by other trigger functions) will re-execute the case.

---

## Projection Pattern (inspections.js)

A projection trigger flattens deep subcollection data up into multiple sibling or parent documents for efficient querying:

```js
// One inspection write triggers three separate writes:
const processInspectionProjection = async ({ vendorID, vehicleID, inspectionID, inspectionData }) => {
  // 1. Update vehicle summary (denormalised last-inspection fields)
  await updateVehicleInspectionSummary({ vendorID, vehicleID, inspectionID, inspectionData });

  // 2. Update dispatcher summary (denormalised view per dispatcher)
  if (dispatcherID) {
    await saveDispatcherInspectionSummary({ vendorID, dispatcherID, inspectionID, inspectionData });
  }

  // 3. Append status history entry
  await addStatusHistory({ vendorID, vehicleID, inspectionID, statusReport, inspectionData, authorID });
};
```

This pattern is called identically from both `onVehicleInspectionCreated` and `onVehicleInspectionUpdated` to avoid duplicating logic.

---

## Re-entry Guard (updatedByFunction sentinel)

When a trigger writes back to the same document it was triggered by, Firestore re-fires the trigger. The sentinel breaks the loop:

```js
// In the trigger:
if (inspectionData?.updatedByFunction) {
  logger.info(`Skipping self-triggered update ${inspectionID}`);
  return;
}

// In any write that would re-trigger:
await vehicleRef.set({
  ...updatePayload,
  updatedByFunction: true,   // ← sentinel written alongside real data
}, { merge: true });
```

**Rule:** Any Cloud Function that writes to a collection it also listens to must set `updatedByFunction: true` on that write. The trigger handler must check `data?.updatedByFunction` as the first validation.

---

## Batch Writes for Fan-out

When cancelling or closing many documents atomically:

```js
// Pattern from onRequestUpdated 'cancelled' case
const snapshot = await db
  .collectionGroup('requests')
  .where('requestID', '==', requestID)
  .get();

const batch = db.batch();

snapshot.forEach((docSnap) => {
  batch.update(docSnap.ref, {
    status: 'cancelled',
    updatedAt: FieldValue.serverTimestamp(),
  });
});

await batch.commit();
```

Firestore batches support up to 500 operations. For large fan-outs, use multiple sequential batch commits.

---

## CollectionGroup Queries for Cross-Vendor Lookups

Finding all `vendor_requests` for a given `requestID` across all vendors requires a `collectionGroup` query:

```js
const snapshot = await db
  .collectionGroup('requests')        // matches any subcollection named 'requests'
  .where('requestID', '==', requestID)
  .get();
```

The field `requestID` must be stored inside each `vendor_requests/{vendorID}/requests/{id}` document for this query to work. Triggers that fan out documents must always include this identifier.

---

## Error Handling Pattern

```js
// Every case in the switch has its own try/catch
case 'signed':
  try {
    // all writes here
  } catch (err) {
    logger.error('Error processing signed status:', err);
  }
  break;
```

Errors in one case do not bubble up to break other cases. Each transition is independently fault-tolerant.

---

## Logging Conventions

```js
logger.info(`📌 Update detected on request ${requestID}`);
logger.info(`📡 Status changed: ${previousStatus} → ${newStatus}`);
logger.warn(`⚠️ No vendor_requests found for cancelled request ${requestID}`);
logger.error(`❌ Missing confirmedVendor or finderID`);
logger.info(`✅ Vendor requests cancelled for request ${requestID}`);
```

Emoji prefixes used: `📌` detect, `📡` status change, `🔍` lookup, `📦` query result, `✅` success, `❌` error, `⚠️` warning, `🚀` major event.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Writing to a trigger's own collection without `updatedByFunction` sentinel | Infinite loop |
| Checking `newStatus !== undefined` instead of `previousStatus !== newStatus` | Fires on every write, not just status changes |
| Using `doc.update()` inside a loop without a batch | Thundering herd of writes; should batch |
| Reading `event.data.data()` without optional chaining | Crashes on race condition where doc was deleted |
| Sharing state across parallel case branches | Cases should be independent |
| Awaiting inside a `snapshot.forEach()` callback | Does not work — use `Promise.all` with `snapshot.docs.map` |

---

## Testing Guidance

```
GIVEN a request document transitions from 'open' to 'cancelled'
WHEN onRequestUpdated fires
THEN all vendor_requests with matching requestID are batch-updated to 'cancelled'

GIVEN a request transitions from 'pending' to 'accepted'
WHEN onRequestUpdated fires
THEN the confirmedVendor's vendor_request is set to 'accepted'
AND all other vendor_requests are set to 'closed'

GIVEN an inspection is created
WHEN onVehicleInspectionCreated fires
THEN the vehicle document's inspectionSummary field is updated
AND a statusHistory entry is created

GIVEN onVehicleInspectionUpdated fires with updatedByFunction = true
WHEN the trigger handler runs
THEN no projection writes are executed (sentinel respected)
```

---

## Factory Governance

- Factory generates trigger functions into `/tmp` clone only
- Every trigger function must check `event.data` for null before reading data
- Status machine switches must check `previousValue !== newValue` before executing
- Any write to a self-triggering collection must include `updatedByFunction: true`
- Factory does not generate functions that deploy or activate triggers — Claude Code does that
- Claude Code owns review, integration, and final deploy
