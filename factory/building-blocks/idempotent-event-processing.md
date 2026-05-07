# Building Block: Idempotent Event Processing

## Purpose

Documents the patterns used in LogiTruck Cloud Functions to ensure that executing a function multiple times with the same input produces the same result as executing it once. Covers Firestore existence checks, sentinel fields, guard clauses, and the specific idempotency gaps that exist in the current codebase.

---

## Operational Problem Solved

Cloud Functions can be invoked more than once for the same event due to: client retries on timeout, Pub/Sub at-least-once delivery, and failed trigger executions being manually re-triggered by operators. Without idempotency guards, duplicate invocations create duplicate records, send duplicate notifications, and charge Stripe accounts twice.

---

## Real Examples from Codebase

### Pattern 1: Existence check before create

```js
// chat/utils.js — createChannel
exports.createChannel = async (data) => {
  const channel = await chatChannelsRef.doc(id).get();
  if (channel?.exists) {
    console.log('invalid op, channel already exists');
    return channel.data();  // ← return existing, no re-create
  }
  await chatChannelsRef.doc(id).set(data);
  // ...
};
```

```js
// openai/utils.js — createChannelAI (OpenAI thread idempotency)
const channelAI = await chatChannelsAIRef.doc(id).get();
if (channelAI.exists) {
  return channelAI.data();  // ← return existing channel
}
// Also checks OpenAI thread:
try {
  const existingThread = await openai.beta.threads.retrieve(threadID);
  if (existingThread?.id) return { status: 'error', message: 'Thread already exists' };
} catch { /* no existing thread — proceed */ }
```

```js
// projects/onSetupFlagWritten.js — job creation
const existingJobsSnap = await jobsRef.get();
if (!existingJobsSnap.empty) {
  // Jobs already exist — just advance status, don't recreate
  await projectRef.update({ status: 'execution', updatedAt: FieldValue.serverTimestamp() });
  return;  // ← exit without creating duplicate jobs
}
```

### Pattern 2: Stripe account idempotency

```js
// stripe/stripeconnect.js — createStripeAccount
const userDoc = await db.collection('stripe_accounts').doc(userId).get();
if (userDoc.exists) {
  stripeAccountId = userDoc.data().stripeAccountId;

  if (userDoc.data().chargesEnabled) {
    return { message: 'El usuario ya tiene Stripe configurado.', accountId: stripeAccountId };
  }
  // User exists but hasn't completed onboarding — regenerate link
  if (data.refresh) {
    const accountLink = await stripe.accountLinks.create({ ... });
    return { accountId: stripeAccountId, url: accountLink.url };
  }
}
// User doesn't exist → create new Stripe Express account
```

### Pattern 3: updatedByFunction sentinel

```js
// inspections/inspections.js — onVehicleInspectionUpdated
if (inspectionData?.updatedByFunction) {
  logger.info(`🚫 Skipping self-triggered update ${inspectionID}`);
  return;  // ← prevents re-processing trigger's own write
}
// ... projection logic ...
await vehicleRef.set({
  ...updatePayload,
  updatedByFunction: true,  // ← set on write to prevent re-trigger
}, { merge: true });
```

### Pattern 4: Status diff guard

```js
// onRequestUpdated.js, onVendorRequestUpdated.js
const previousStatus = before.status;
const newStatus = after.status;

if (previousStatus !== newStatus) {
  // Only execute when status actually changed
  switch (newStatus) { ... }
}
```

Without this guard, every field update on the document (e.g., `updatedAt` being refreshed) would re-execute all status machine cases.

---

## Idempotency Decision Matrix

| Operation | Idempotency strategy | Location |
|---|---|---|
| Create chat channel | Firestore existence check + return existing | `chat/utils.js` |
| Create AI channel + thread | Firestore check + OpenAI API check | `openai/utils.js` |
| Create project jobs | `existingJobsSnap.empty` check | `onSetupFlagWritten.js` |
| Create Stripe account | `stripe_accounts` doc existence + `chargesEnabled` | `stripeconnect.js` |
| Inspection projection | `updatedByFunction` sentinel on self-writes | `inspections.js` |
| Status machine transitions | `previousStatus !== newStatus` diff | `onRequestUpdated.js` |
| Vendor distribution fan-out | **MISSING** — no idempotency guard | `distributeRequest.js` |
| Push notifications | **MISSING** — no deduplication | `notifications/utils.js` |

---

## Idempotency Gaps (Current Risks)

### distributeRequest.js — no fan-out guard

```js
// onRequestCreated fires on every document create — no re-entry protection
// If the function times out mid-loop and is manually re-triggered,
// vendor_requests documents already written get .set() called again
// (safe due to merge: false being .set() default — data is overwritten, not doubled)
// BUT push notifications fire again for every vendor already notified
```

**Risk:** Vendor users receive duplicate "New freight request" notifications if the trigger is manually re-triggered after a partial failure.

**Fix:** Check `vendor_requests/{vendorID}/requests/{requestID}` existence before write + notification.

### notifications/utils.js — no send deduplication

```js
// sendPushNotification() sends every time it is called
// No check for: "did we already send this notification to this user for this event?"
// The notifications collection is written AFTER sending, not used as a deduplication check
```

**Risk:** Any function that calls `sendPushNotification` multiple times (retries, multiple triggers) will send duplicate pushes.

---

## Transaction Boundaries for Idempotency

For operations that must be atomic AND idempotent, use Firestore transactions:

```js
// Proposed pattern for idempotent state-change + record creation
await db.runTransaction(async (tx) => {
  const snap = await tx.get(entityRef);
  if (!snap.exists) throw new Error('not found');

  const data = snap.data();
  if (data.status !== 'pending') {
    // Already processed — idempotent exit inside transaction
    return;
  }

  tx.update(entityRef, { status: 'processing', processedAt: FieldValue.serverTimestamp() });
  tx.set(recordRef, { ... });
});
```

Transactions provide read-your-own-writes semantics: if two concurrent calls both read `status: 'pending'`, only one will succeed in writing `status: 'processing'` — the other will retry and find `status !== 'pending'`, exiting cleanly.

---

## Sentinel Field Pattern

When a trigger must write back to its own trigger collection, use a sentinel field to mark function-originated writes:

```js
// Write pattern — include sentinel
await docRef.set({
  ...payload,
  updatedByFunction: true,
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });

// Read pattern — check sentinel first
if (data?.updatedByFunction) {
  logger.info('Skipping function-originated write');
  return;
}
```

The sentinel ONLY prevents re-trigger loops. It does not provide idempotency across separate invocations of the same trigger on different events.

---

## Retry Considerations

| Invocation type | Default retry behavior | Idempotency requirement |
|---|---|---|
| `onCall` | No retry — client controls | Optional but recommended |
| `onRequest` | No retry — caller controls | Required if caller can retry |
| Firestore trigger (v2) | No automatic retry | Required for manual re-trigger scenarios |
| Cloud Tasks worker | Retries on non-200 | **Required** — Cloud Tasks guarantees at-least-once |
| `onSchedule` | No retry on completion, reruns on next schedule | Required — same job runs next day regardless |

---

## Scaling Considerations

Idempotency checks (Firestore reads before writes) add latency. For high-frequency operations:
- Use a dedicated `processed_events/{eventID}` collection as a deduplication log
- Write to it in a transaction with the main operation
- Check it before executing any expensive logic

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Writing notification delivery to DB only after sending | Send already happened; if send fails the log is inconsistent |
| Using `updatedByFunction` as the ONLY idempotency guard | Only prevents self-triggers; doesn't protect against external duplicate events |
| Checking document existence without a transaction | TOCTOU race: two concurrent calls both see `!exists`, both write |
| Not returning early on idempotent exit paths | Subsequent code may execute writes unintentionally |
| Relying on Firestore `merge: true` for idempotency | Merges overwrite fields but still fire triggers; notifications still send |

---

## Testing Guidance

```
GIVEN createChannel is called twice with the same channel ID
WHEN the second call runs
THEN the existing channel data is returned without a second write to Firestore

GIVEN onSetupFlagWritten fires and creates jobs successfully
WHEN the trigger fires again (duplicate event)
THEN existingJobsSnap.empty is false → function advances status and exits without creating jobs

GIVEN onVehicleInspectionUpdated fires after the function wrote updatedByFunction=true
WHEN the trigger runs
THEN the sentinel is detected → function logs and returns without running projection

GIVEN distributeRequest.js runs and a vendor_request already exists for vendorID+requestID
WHEN the trigger re-runs (missing idempotency guard — current state)
THEN vendor_request is overwritten AND push notification is sent again (documented gap)
```

---

## Factory Governance

- Factory generates every state-creating function with an existence check before the write
- Every Cloud Task worker function includes an idempotency check that returns HTTP 200 on "already processed"
- Factory uses `updatedByFunction` sentinel on every self-writing trigger
- Factory uses `previousValue !== newValue` guard on every `onDocumentUpdated` status handler
- Notification sends must be preceded by a deduplication check (to be implemented)
- Claude Code reviews idempotency logic before integration
