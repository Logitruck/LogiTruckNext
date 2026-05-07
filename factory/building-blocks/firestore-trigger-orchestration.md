# Building Block: Firestore Trigger Orchestration

## Purpose

Documents the complete orchestration topology of Firestore triggers in LogiTruck: which triggers fire when, what writes they cascade, how bidirectional sync works between `requests` and `vendor_requests`, how `onDocumentWritten` implements barrier patterns, how the profile propagation fan-out works, and the specific risks in the current implementation.

---

## Operational Problem Solved

Multi-collection consistency cannot be enforced by clients. Triggers provide the coordination layer: when one document transitions, the trigger updates 2–10 related documents atomically or sequentially, ensuring all views of the data stay consistent regardless of which app or user caused the initial write.

---

## Complete Trigger Map

```
users/{userID}
  → propagateUserProfileUpdates (onDocumentUpdated)
      → messages_live, messages_historical (collectionGroup)
      → chat_feed_live, chat_feed_historical (collectionGroup)
      → social_graph collections
      → authored listing collections

requests/{requestID}
  → onRequestCreated (onDocumentCreated)
      → vendor_requests/{vendorID}/requests/{requestID} [fan-out, N writes]
      → push notifications to carrier users
  → onRequestUpdated (onDocumentUpdated)
      → status machine switch: cancelled|accepted|to_sign|signed|execution
      → vendor_requests batch updates
      → project_channels/{channelID} (on signed)
      → project_channels/{channelID}/projects/{requestID} (on signed)

vendor_requests/{vendorID}/requests/{requestID}
  → onVendorRequestUpdated (onDocumentUpdated)
      → requests/{requestID} (status sync back to parent)

vendor_vehicles/{vendorID}/vehicles/{vehicleID}/inspections/{inspectionID}
  → onVehicleInspectionCreated (onDocumentCreated)
      → vendor_vehicles/{vendorID}/vehicles/{vehicleID} (summary update)
      → carrier_inspections/{vendorID}/dispatchers/{dispatcherID}/inspections/{id}
      → statusHistory subcollection
  → onVehicleInspectionUpdated (onDocumentUpdated)
      → same as above, guarded by updatedByFunction sentinel

project_channels/{channelID}/projects/{projectID}/setupFlags/{role}
  → onSetupFlagWritten (onDocumentWritten)
      → waits for BOTH finder and carrier flags to be done=true
      → creates jobs batch when barrier is met
      → project status → 'execution'
```

---

## Bidirectional Sync: requests ↔ vendor_requests

This is the most architecturally complex pattern. Two triggers watch the same deal and propagate status in opposite directions:

```
requests/{id}.status changes
  → onRequestUpdated fires
    → updates vendor_requests/{confirmedVendor}/requests/{id}.status

vendor_requests/{vendorID}/requests/{id}.status changes
  → onVendorRequestUpdated fires
    → if isConfirmedVendor: updates requests/{id}.status back
```

### Loop prevention

`onVendorRequestUpdated` guards against double-fire by checking:
```js
const isConfirmedVendor = requestData?.confirmedVendor === vendorID;
// Only confirmed vendor's writes propagate back to the parent
```

`onRequestUpdated` prevents loop by always checking `previousStatus !== newStatus` before executing any case. If the trigger wrote the same status the document already had, the switch runs but writes the same value — no re-trigger.

However: **there is no `updatedByFunction` sentinel on the bidirectional sync.** If both triggers fire simultaneously (race), they can write each other's status back and forth until they converge. This is a documented risk.

---

## Barrier Pattern: onDocumentWritten

```js
// onSetupFlagWritten.js — waits for two parties to complete setup
exports.onSetupFlagWritten = onDocumentWritten(
  'project_channels/{channelID}/projects/{projectID}/setupFlags/{role}',
  async (event) => {
    const currentFlag = event.data?.after?.data();
    if (!currentFlag?.done) return;             // this role not done yet

    const otherRole = role === 'finder' ? 'carrier' : 'finder';
    const otherSnap = await flagsRef.doc(otherRole).get();
    if (!otherSnap.exists || otherSnap.data()?.done !== true) return;  // other not done

    // Both done — create jobs
    const existingJobsSnap = await jobsRef.get();
    if (!existingJobsSnap.empty) {
      // Idempotency: jobs already exist, just advance status
      await projectRef.update({ status: 'execution', ... });
      return;
    }

    // Create all jobs in a single batch
    const batch = db.batch();
    routes.forEach((route) => {
      for (let trip = 1; trip <= tripsForRoute; trip++) {
        batch.set(jobsRef.doc(), { status: 'pending', ... });
      }
    });
    await batch.commit();
  }
);
```

`onDocumentWritten` fires on create, update, AND delete. The `after?.data()?.done` check handles the case where the document was deleted (after is null → done is undefined → guard returns).

---

## User Profile Fan-out

```js
// triggers.js — propagateUserProfileUpdates
const updateAllRelatedData = async (userData) => {
  await updateChatConversations(userData, 'messages_live');
  await updateChatConversations(userData, 'messages_historical');
  await updateChatFeeds(userData, 'chat_feed_live');
  await updateChatFeeds(userData, 'chat_feed_historical');
  await updateSocialGraph(userData);
  // 6 listing collection types
};
```

Each `update*` function issues a `collectionGroup` query and iterates results sequentially. This is an **unbounded O(N) write sequence** inside a trigger — a user with thousands of messages will cause this trigger to run for minutes or time out at 540s (Cloud Functions default).

---

## onDocumentCreated vs onDocumentUpdated vs onDocumentWritten

| Trigger | `event.data` access | Use case |
|---|---|---|
| `onDocumentCreated` | `event.data?.data()` | Initialize derived state |
| `onDocumentUpdated` | `event.data?.before.data()` / `event.data?.after.data()` | React to state change, before/after diff |
| `onDocumentWritten` | `event.data?.after?.data()` (null if deleted) | Barrier/convergence — fire on any write |

---

## Transaction Boundaries

Firestore triggers do NOT run inside a transaction relative to the write that triggered them. They are eventually consistent:

1. Client writes `requests/{id}.status = 'accepted'`
2. Firestore confirms the write to the client
3. Cloud Functions sees the trigger asynchronously (ms to seconds later)
4. The trigger runs its own reads and writes as separate operations

If a trigger fails mid-execution, partial writes remain. There is no automatic rollback. For multi-document consistency, use `batch.commit()` within the trigger to make the trigger's own writes atomic.

---

## Retry and Idempotency Considerations

Firestore triggers in v2 do not automatically retry on failure by default. If a trigger fails (timeout, unhandled error), those writes are lost unless an external monitoring system re-triggers them.

The `updatedByFunction` sentinel prevents infinite loops from self-triggering writes but does not provide idempotency for the projection logic itself. If `onVehicleInspectionUpdated` runs twice (due to a duplicate event), it will run the projection twice, overwriting with the same data (safe due to merge semantics, but not guaranteed idempotent for history subcollections).

---

## Current Backend Risks

| Risk | Location | Impact |
|---|---|---|
| Bidirectional sync has no `updatedByFunction` guard | `onRequestUpdated` ↔ `onVendorRequestUpdated` | Status loop possible on concurrent writes |
| Profile propagation is O(N) sequential | `triggers.js` `updateAllRelatedData` | Timeout for users with large message history |
| `distributeRequest` full vendor scan on every request creation | `distributeRequest.js` | All vendor docs loaded into memory; no pagination |
| No dead-letter queue for failed trigger executions | All triggers | Failed writes silently lost |
| `updateChatConversations` uses `forEach` with `doc.ref.set(data, {merge:true})` but no await | `triggers.js` line ~77 | Writes fire and forget — no error surface |

---

## Scaling Considerations

- `onRequestCreated` iterates ALL vendors sequentially. At 100 vendors, this is 100+ location queries + 100 notification sends, all in one trigger execution. At 1000 vendors, this times out. **Refactor to Cloud Tasks when vendor count exceeds 50.**
- `propagateUserProfileUpdates` has the same problem. Use `BulkWriter` instead of sequential awaits for the update loops.
- `onSetupFlagWritten` batch creates all jobs for a project in one transaction. At 500+ jobs (large multi-route project), this hits the 500-operation Firestore batch limit.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `event.data.after.data()` without optional chaining | Crashes if doc deleted before function runs |
| Awaiting inside `.forEach()` | `forEach` ignores returned Promises; writes fire-and-forget |
| Writing to the trigger's own collection without `updatedByFunction` | Infinite re-trigger loop |
| Not checking `previousStatus !== newStatus` in updated triggers | Every field write re-executes the status logic |
| Skipping `batch.commit()` for fan-out writes | Each write is a separate transaction; partial failure leaves inconsistent state |

---

## Failure Recovery Strategy

1. **Logs first** — every trigger logs at entry, on skip, and on success/failure with document IDs
2. **Silent failures** — catch at the case level, log, do not rethrow; trigger completes even if one branch fails
3. **Manual re-trigger** — for critical failures (signed → project creation fails), the operator can update a sentinel field to re-fire the trigger
4. **No automatic retry** — v2 Firestore triggers do not retry; monitor Cloud Logging for `❌` entries

---

## Factory Governance

- Factory generates trigger functions into `/tmp` clone only
- All `onDocumentWritten` functions must handle `null` `after.data()` (deletion case)
- Bidirectional sync functions must include `isConfirmedVendor` or equivalent guard
- All projection functions must check `updatedByFunction` sentinel
- Fan-out loops over unbounded collections must be flagged for Cloud Tasks migration
- Claude Code owns review, sentinel verification, and deployment
