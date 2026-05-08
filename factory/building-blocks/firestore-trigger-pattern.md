# Building Block: Firestore Trigger Pattern

## Pattern Summary

Cloud Functions v2 Firestore triggers (`onDocumentCreated`, `onDocumentUpdated`) react to document writes and maintain derived state across collections. The pattern establishes: safe data extraction from the event, a re-entry guard via `updatedByFunction`, a projection helper function that performs the actual writes, and structured error handling that logs without crashing.

---

## Problem Being Solved

Firestore is eventually consistent and has no stored procedures. Cross-collection integrity — vehicle summaries reflecting the latest inspection, dispatcher views staying in sync, status cascades propagating to related documents — requires server-side code that runs reliably on every write, regardless of which client caused it.

---

## Where This Pattern Appears in the Codebase

| File | Trigger | Path | What it maintains |
|---|---|---|---|
| `functions/triggers/inspections/inspections.js` | `onDocumentCreated` + `onDocumentUpdated` | `vendor_vehicles/{vendorID}/vehicles/{vehicleID}/inspections/{inspectionID}` | Vehicle summary, dispatcher summary, status history |
| `legacy: dispatch/dispatchv2.js` | `onDocumentUpdated` | Inspections subcollection | Activates pending jobs when inspection approved (legacy-removed — no current equivalent) |
| `functions/triggers/distributeRequest/distributeRequest.js` | `onDocumentCreated` | `requests/{requestID}` | Fan-out to vendor_requests, push notifications |
| `functions/triggers/deels/onRequestUpdated.js` | `onDocumentUpdated` | `requests/{requestID}` | Status machine, project creation |

---

## Canonical Created Trigger

```js
// functions/triggers/inspections/inspections.js
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

exports.onVehicleInspectionCreated = onDocumentCreated(
  'vendor_vehicles/{vendorID}/vehicles/{vehicleID}/inspections/{inspectionID}',
  async (event) => {
    const { vendorID, vehicleID, inspectionID } = event.params;
    const inspectionData = event.data?.data();

    // Safe data guard
    if (!inspectionData) {
      logger.error(`❌ No data found for inspection ${inspectionID}`);
      return;
    }

    // Domain validation
    if (!inspectionData.vehicleID || !inspectionData.vehicleType) {
      logger.error(`❌ Inspection ${inspectionID} is missing vehicleID or vehicleType`);
      return;
    }

    try {
      await processInspectionProjection({ vendorID, vehicleID, inspectionID, inspectionData });
    } catch (error) {
      logger.error(`❌ Error processing created inspection ${inspectionID}:`, error);
    }
  },
);
```

---

## Canonical Updated Trigger

```js
exports.onVehicleInspectionUpdated = onDocumentUpdated(
  'vendor_vehicles/{vendorID}/vehicles/{vehicleID}/inspections/{inspectionID}',
  async (event) => {
    const { vendorID, vehicleID, inspectionID } = event.params;
    const inspectionData = event.data?.after?.data();  // ← .after for updated

    if (!inspectionData) {
      logger.error(`❌ No updated data found for inspection ${inspectionID}`);
      return;
    }

    // Re-entry guard — REQUIRED when this function writes back to a watched collection
    if (inspectionData?.updatedByFunction) {
      logger.info(`🚫 Skipping self-triggered update ${inspectionID}`);
      return;
    }

    try {
      await processInspectionProjection({ vendorID, vehicleID, inspectionID, inspectionData });
    } catch (error) {
      logger.error(`❌ Error processing updated inspection ${inspectionID}:`, error);
    }
  },
);
```

---

## Data Extraction Reference

| Event type | How to access data |
|---|---|
| `onDocumentCreated` | `event.data?.data()` |
| `onDocumentUpdated` (new state) | `event.data?.after?.data()` |
| `onDocumentUpdated` (old state) | `event.data?.before?.data()` |
| Path params | `event.params.{wildcard}` |

Always use optional chaining (`?.`) on `event.data`. The event snapshot can be null if the document was deleted between event firing and function execution.

---

## Re-entry Guard — updatedByFunction Sentinel

When a trigger writes to the same collection it listens to, Firestore fires the trigger again on that write. The sentinel breaks the loop:

```js
// In the trigger handler — check early:
if (data?.updatedByFunction) {
  logger.info('Skipping self-triggered update');
  return;
}

// In any write the function makes back to the triggering collection:
await docRef.set({
  ...payload,
  updatedByFunction: true,   // sentinel
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });
```

**Rule:** `updatedByFunction` must be set on every write that touches a collection the function is triggered by. The handler must check it as one of the first validations.

---

## Projection Helper Pattern

Split trigger handlers into: (1) a thin event handler that extracts params, validates data, and calls the re-entry guard; and (2) a dedicated projection function that performs the actual writes. Both the create and update triggers call the same projection function:

```js
const processInspectionProjection = async ({
  vendorID, vehicleID, inspectionID, inspectionData,
}) => {
  // Input validation at projection level
  if (!inspectionID) {
    logger.error('❌ Missing inspectionID');
    return;
  }

  // Parallel helper writes
  if (dispatcherID) {
    await saveDispatcherInspectionSummary({ vendorID, dispatcherID, inspectionID, inspectionData });
  }

  await updateVehicleInspectionSummary({ vendorID, vehicleID, inspectionID, inspectionData });
  await addStatusHistory({ vendorID, vehicleID, inspectionID, statusReport, inspectionData, authorID });

  logger.info(`✅ Inspection projection ${inspectionID} processed`);
};
```

This avoids duplicating logic between the created and updated handlers.

---

## Conditional Projection Logic

The vehicle summary update contains business logic that sets operational flags based on inspection type and status:

```js
// inspections.js — updateVehicleInspectionSummary
if (inspectionType === 'pretrip' && statusReport === 'approved_for_operation') {
  updatePayload.operationSessionOpen = true;
  updatePayload.requiresPretrip = false;
  updatePayload.requiresPosttrip = true;
  updatePayload.operationalStatus = canContinueOperation === false ? 'blocked' : 'approved';
}

if (inspectionType === 'posttrip') {
  updatePayload.operationSessionOpen = false;
  updatePayload.requiresPretrip = true;
  updatePayload.requiresPosttrip = false;
}

if (statusReport === 'blocked_for_operation') {
  updatePayload.operationalStatus = 'blocked';
  updatePayload.requiresPretrip = true;
}
```

Conditional logic inside projection helpers must be exhaustive — every valid combination of `inspectionType` and `statusReport` should produce a defined output.

---

## Location Update Pattern

When a document contains location data, the trigger propagates it to the parent:

```js
if (inspectionLocation?.latitude && inspectionLocation?.longitude) {
  updatePayload.currentLocation = {
    latitude: inspectionLocation.latitude,
    longitude: inspectionLocation.longitude,
  };
  updatePayload.lastInspectionLocation = { ... };
}
```

Location updates are conditional — only apply when coordinates are present and valid.

---

## Logging Conventions

```js
logger.info(`📥 Processing projection ${id} for vendor=${vendorID}`);
logger.info(`✅ Projection ${id} processed`);
logger.warn(`⚠️ vehicleID mismatch: path=${vehicleID}, doc=${data.vehicleID}`);
logger.error(`❌ Missing required field ${field}`);
logger.info(`🚫 Skipping self-triggered update ${id}`);
```

Always log the document ID and relevant identifiers. This makes Cloud Logging queries actionable.

---

## Error Handling Pattern

```js
try {
  await processProjection(...);
} catch (error) {
  logger.error(`❌ Error processing ${inspectionID}:`, error);
  // Do NOT rethrow — let the function complete
  // Firestore triggers do not retry on thrown errors in v2 by default
}
```

Rethrowing causes Cloud Functions to mark the execution as failed. For Firestore triggers, log and continue; do not rethrow unless the failure is idempotent-safe to retry.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `event.data.data()` without optional chaining | Crashes if doc was deleted before function runs |
| No re-entry guard on self-writing updated triggers | Infinite loop, unbounded writes |
| Awaiting inside `snapshot.forEach()` | `forEach` ignores returned Promises |
| Throwing from the event handler | Marks function as failed; does not retry correctly for Firestore triggers |
| Mutating `inspectionData` directly | The event data is immutable; build a new `updatePayload` object |
| Writing to parent doc without `{ merge: true }` | Overwrites all existing fields |

---

## Testing Guidance

```
GIVEN an inspection document is created with all required fields
WHEN onVehicleInspectionCreated fires
THEN the vehicle document's inspectionSummary is updated
AND a statusHistory entry exists in the subcollection

GIVEN an inspection document is updated with updatedByFunction = true
WHEN onVehicleInspectionUpdated fires
THEN no writes are executed (re-entry guard respected)

GIVEN an inspection with inspectionType = 'pretrip' and statusReport = 'approved_for_operation'
WHEN the projection runs
THEN vehicle.operationSessionOpen = true and requiresPosttrip = true

GIVEN inspectionData is null (document deleted between event and execution)
WHEN the handler runs
THEN logger.error is called and the function returns without writing
```

---

## Factory Governance

- Factory generates trigger functions into `/tmp` clone only
- Every `onDocumentUpdated` handler must include a re-entry guard check
- Projection logic must be extracted into a named helper function
- Event data access must use optional chaining on both `event.data` and the sub-properties
- Factory does not deploy functions — Claude Code reviews and deploys
