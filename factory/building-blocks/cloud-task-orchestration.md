# Building Block: Cloud Task Orchestration

## Purpose

Documents the architectural pattern for Cloud Tasks in LogiTruck — including its current absence, the specific trigger patterns that require it, the canonical implementation pattern, and the migration path from the existing synchronous fan-out loops that are breaking under scale.

---

## Operational Problem Solved

Cloud Functions have a maximum execution time (540 seconds default, 3600 seconds max). Firestore triggers that iterate over unbounded collections — like distributing a request to every vendor — will time out as data grows. Cloud Tasks decouple the trigger from the per-item work: the trigger enqueues tasks, each task processes one item independently, and each item retries on failure without affecting others.

---

## Current State: Cloud Tasks NOT Implemented

Cloud Tasks (`@google-cloud/tasks`) does not appear anywhere in the current `functions/` codebase. All async work that requires per-item processing currently runs synchronously inside triggers or callable functions.

The closest existing pattern to async scheduling is `onSchedule` (Firebase Scheduler). The `resetVehicleStatusDaily.js` pattern below is from the legacy repo (no `onSchedule` functions exist in the current `functions/` codebase) but the pattern remains canonical for future scheduled jobs:

```js
// Pattern reference — no onSchedule functions currently active in functions/
const resetVehicleOperationalStatusDaily = onSchedule(
  { schedule: '0 4 * * *', timeZone: 'America/New_York', region: 'us-central1' },
  async () => {
    const vendorVehiclesSnapshot = await db.collection('vendor_vehicles').get();
    for (const vendorDoc of vendorVehiclesSnapshot.docs) {
      // per-vendor batch update
    }
  }
);
```

This works for daily batch work but not for event-driven fan-out.

---

## Active Risk: distributeRequest Fan-out Loop

```js
// functions/triggers/distributeRequest/distributeRequest.js — CURRENT HIGH RISK PATTERN
exports.onRequestCreated = onDocumentCreated('requests/{requestID}', async (event) => {
  const vendorSnapshot = await db.collection('vendors').get();  // ALL vendors loaded

  for (const vendorDoc of vendorSnapshot.docs) {
    // Per vendor:
    const locationsSnapshot = await db
      .collection('vendor_locations')
      .doc(vendorID)
      .collection('locations')
      .get();  // ← Firestore read INSIDE loop

    // Per route per location: haversine distance check
    // Per vendor: db.set() for vendor_request
    // Per vendor: vendor_users query for eligible users
    // Per eligible user: sendPushNotification() → HTTP call to FCM
  }
});
```

**Problem:** With N vendors, this trigger performs:
- 1 full collection scan (all vendors)
- N location subcollection reads
- N vendor_users subcollection reads
- N Firestore writes
- N×M FCM HTTP calls

At 200 vendors with 3 users each, this is ~1000+ operations inside a single trigger execution. Firestore trigger timeout is 540s. This WILL time out as the platform grows.

---

## Canonical Cloud Task Pattern (To Be Implemented)

### Step 1: Trigger enqueues tasks (fast, bounded)

```js
// distributeRequest-refactored.js — PROPOSED PATTERN
const { CloudTasksClient } = require('@google-cloud/tasks');
const tasksClient = new CloudTasksClient();

exports.onRequestCreated = onDocumentCreated('requests/{requestID}', async (event) => {
  const requestData = event.data?.data();
  const { requestID } = event.params;
  if (!requestData || !requestData.finderID) return;

  const vendorSnapshot = await db.collection('vendors').get();

  // Only enqueue — no per-vendor work here
  const enqueuePromises = vendorSnapshot.docs.map(vendorDoc => {
    const vendorID = vendorDoc.id;
    if (vendorID === requestData.finderID) return null;

    return tasksClient.createTask({
      parent: tasksClient.queuePath(projectID, location, 'distribute-request-queue'),
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: `https://${region}-${projectID}.cloudfunctions.net/processVendorDistribution`,
          body: Buffer.from(JSON.stringify({ requestID, vendorID })).toString('base64'),
          headers: { 'Content-Type': 'application/json' },
        },
        scheduleTime: { seconds: Date.now() / 1000 },  // immediate
      },
    });
  }).filter(Boolean);

  await Promise.all(enqueuePromises);
  logger.info(`📬 Enqueued ${enqueuePromises.length} distribution tasks for ${requestID}`);
});
```

### Step 2: Worker function processes one vendor (isolated, retryable)

```js
// processVendorDistribution.js — PROPOSED PATTERN
exports.processVendorDistribution = onRequest(async (req, res) => {
  const { requestID, vendorID } = req.body;

  // Idempotency check — has this vendor already been distributed to?
  const existingSnap = await db
    .collection('vendor_requests')
    .doc(vendorID)
    .collection('requests')
    .doc(requestID)
    .get();

  if (existingSnap.exists) {
    logger.info(`⏭️ Already distributed ${requestID} to ${vendorID} — skipping`);
    return res.status(200).send('already_processed');
  }

  // Per-vendor geo matching + write + notification
  // Failure here only retries THIS vendor, not all vendors
  await distributeToVendor(requestID, vendorID);

  return res.status(200).send('ok');
});
```

---

## onSchedule as Bounded Async Work

For work that does not need to be event-driven, `onSchedule` is the appropriate pattern. The existing `resetVehicleStatusDaily` is correctly structured:

```js
const resetVehicleOperationalStatusDaily = onSchedule(
  {
    schedule: '0 4 * * *',       // cron: 4am daily
    timeZone: 'America/New_York',
    region: 'us-central1',
  },
  async () => {
    const vendorVehiclesSnapshot = await db.collection('vendor_vehicles').get();

    for (const vendorDoc of vendorVehiclesSnapshot.docs) {
      const vehiclesSnapshot = await db
        .collection('vendor_vehicles').doc(vendorDoc.id).collection('vehicles').get();

      const batch = db.batch();
      for (const vehicleDoc of vehiclesSnapshot.docs) {
        // check if approved status expired today
        if (shouldReset(vehicleDoc.data())) {
          batch.set(vehicleRef, { operationalStatus: 'pending', requiresPretrip: true, ... }, { merge: true });
        }
      }
      await batch.commit();  // per-vendor batch
    }
  }
);
```

The `batch.commit()` is called per-vendor, not across all vendors. This means at most 500 vehicle updates per batch, preventing batch limit errors.

---

## Task Queue Configuration

```js
// Required queue creation (one-time, via gcloud or Terraform)
// gcloud tasks queues create distribute-request-queue \
//   --location=us-central1 \
//   --max-dispatches-per-second=10 \
//   --max-concurrent-dispatches=5 \
//   --min-backoff=10s \
//   --max-backoff=300s \
//   --max-attempts=5

const QUEUE_CONFIG = {
  projectId: process.env.GCLOUD_PROJECT,
  location: 'us-central1',
  queue: 'distribute-request-queue',
};
```

---

## Retry and Idempotency

Cloud Tasks retries on non-200 responses. Worker functions MUST be idempotent:

```js
// Worker idempotency pattern — check before write
const existingDoc = await db.collection('vendor_requests')
  .doc(vendorID).collection('requests').doc(requestID).get();

if (existingDoc.exists) {
  return res.status(200).send('already_processed');  // 200 = task complete, no retry
}
```

Return HTTP 200 for "already done" cases — not 409. Cloud Tasks treats any non-200 as a failure to retry. 200 permanently dequeues the task.

---

## Scaling Considerations

| Pattern | Current capacity | Cloud Task capacity |
|---|---|---|
| distributeRequest fan-out | ~50 vendors before timeout | Unlimited (N tasks × 540s each) |
| Per-task retry | None — trigger fails all | Per-vendor retry without affecting others |
| Rate limiting | None | `max-dispatches-per-second` on queue |
| Observability | Single trigger log | Per-task Cloud Logging |

---

## Migration Priority

| Function | Current risk | Priority |
|---|---|---|
| `distributeRequest.js` vendor loop | Timeout at ~200 vendors | **Immediate** |
| `triggers.js` propagateUserProfileUpdates | Timeout for high-volume users | **High** |
| `onSetupFlagWritten.js` batch job creation | 500 batch limit at large projects | **Medium** |

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Firestore read + write inside trigger loop over unbounded collection | O(N) work in a single trigger; times out |
| `await` inside `.forEach()` | forEach ignores returned Promises; sequential awaits don't work |
| Worker returns 500 on "already processed" | Cloud Tasks retries 500 responses; use 200 for idempotent completion |
| Not checking idempotency in worker | Duplicate task execution creates duplicate data |
| Queue size = number of triggered events × N items | Unbounded queue depth; use rate limits on the queue |

---

## Factory Governance

- Factory generates Cloud Task worker functions into `/tmp` clone only
- Workers must: (1) verify idempotency before writing, (2) return 200 for "already done", (3) return 500 only for retryable errors
- Trigger functions that enqueue tasks must NOT do per-item work — enqueue only
- Queue configuration (name, rate limits, retry policy) must be in a separate `queue-config.js` constants file
- Claude Code provisions queues, wires environment variables, and deploys workers
