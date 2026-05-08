# Firestore Data Model Access

## Purpose

This building block defines how the factory generates Firestore queries and writes for LogiTruck collections.

All paths, field names, and ownership rules are derived from `factory/registry/data-model-registry.json`. That file is the single source of truth. This building block translates those facts into generation rules.

---

## Core Rule: vendorID Is Always a Container

`vendor_users`, `vendor_vehicles`, `vendor_requests`, `vendor_locations`, and `carrier_inspections` all follow this pattern:

```
{collection}/{vendorID}/{subcollection}/{docID}
```

The parent doc (the vendorID doc) **has no data**. Always go directly to the subcollection.

```typescript
// CORRECT
const ref = collection(db, 'vendor_users', vendorID, 'users');

// WRONG — reads an empty doc
const ref = doc(db, 'vendor_users', vendorID);
```

**Resolving vendorID:**

```typescript
const vendorID = currentUser?.activeVendorID ?? currentUser?.vendorID ?? null;
if (!vendorID) { setLoading(false); return; }
```

`activeVendorID` takes precedence. Never hardcode or assume a default.

---

## Collection Reference Patterns

### users

```typescript
// Read profile
doc(db, 'users', uid)

// Available drivers (legacy taxi flow — see notes)
query(collection(db, 'users'),
  where('role', '==', 'driver'),
  where('inProgressOrderID', '==', null)
)
```

Key fields: `id`, `email`, `firstName`, `lastName`, `vendorID`, `activeVendorID`, `role`, `rolesArray`, `preferredLanguage`, `profilePictureURL`

### vendors

`vendors` is a **flat collection** — NOT the vendorID-as-container pattern. Each doc IS the vendor (carrier company). The doc ID is the `vendorID`.

```typescript
// Admin SDK (Cloud Functions) — full scan for marketplace distribution
const vendorSnapshot = await db.collection('vendors').get();

// Direct vendor doc read
const vendorRef = db.collection('vendors').doc(vendorID);
const vendorSnap = await vendorRef.get();

// Create a new vendor (callable function — functions/app/carrier/createCarrier.js)
await db.collection('vendors').doc(vendorID).set({
  vendorID,
  name: companyName,
  searchKeywords: [companyName.toLowerCase()],
  serviceCategoryIDs: [],
  status: 'active',
  createdBy: adminUID,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});
```

Key fields: `vendorID`, `name`, `searchKeywords`, `serviceCategoryIDs`, `status`, `createdBy`, `createdAt`, `updatedAt`

**`serviceCategoryIDs` is the matching key** — `distributeRequest.js` compares this against the request's `rideType.id` to determine which vendors are eligible for a new request.

**Write ownership:** Cloud Functions only (`createCarrier` callable, platform admin tools). Never written from a client hook.

**Read ownership:** `distributeRequest` trigger reads the full collection. Client apps do NOT read `vendors` directly — they resolve vendorID from the user profile (`currentUser.vendorID`).

---

### vendor_users

```typescript
// All users for a vendor
collection(db, 'vendor_users', vendorID, 'users')

// Drivers only
query(
  collection(db, 'vendor_users', vendorID, 'users'),
  where('rolesArray', 'array-contains', 'driver')
)
```

Key fields: `id`, `userID`, `firstName`, `lastName`, `email`, `role`, `rolesArray`, `status`, `activeRole`

**Profile writes must update BOTH collections:**

```typescript
await updateDoc(doc(db, 'users', uid), profileFields);
if (vendorID) {
  await updateDoc(doc(db, 'vendor_users', vendorID, 'users', uid), profileFields);
}
```

### vendor_vehicles

```typescript
// All vehicles for a vendor
collection(db, 'vendor_vehicles', vendorID, 'vehicles')

// Batch fetch by vehicleID field
query(
  collection(db, 'vendor_vehicles', vendorID, 'vehicles'),
  where('vehicleID', 'in', vehicleIDChunk)  // max 10 per chunk
)

// Fetch by doc ID
query(
  collection(db, 'vendor_vehicles', vendorID, 'vehicles'),
  where(documentId(), 'in', idChunk)
)

// Direct vehicle doc
doc(db, 'vendor_vehicles', vendorID, 'vehicles', vehicleID)
```

Key fields: `vehicleID`, `name`, `type` (Truck|Trailer), `inspectionSummary`, `requiresPretrip`, `operationSessionOpen`, `lastInspectionType`

**Never write `inspectionSummary` from client.** It is managed by the inspection trigger.

### Inspection paths

There are TWO separate paths for inspection data — they receive the same write, serve different read purposes:

| Path | Purpose | Authoritative |
|------|---------|--------------|
| `vendor_vehicles/{v}/vehicles/{id}/inspections/{id}` | Full inspection record per vehicle | YES |
| `carrier_inspections/{v}/dispatchers/{d}/inspections/{id}` | Read index for dispatcher dashboard | NO (copy) |

```typescript
// Full inspection (source of truth)
doc(db, 'vendor_vehicles', vendorID, 'vehicles', vehicleID, 'inspections', inspectionID)

// Dispatcher view (read-optimized copy)
collection(db, 'carrier_inspections', vendorID, 'dispatchers', dispatcherID, 'inspections')
```

Inspection status history (immutable audit trail — Cloud Function writes only):

```typescript
// READ only from client
collection(db, 'vendor_vehicles', vendorID, 'vehicles', vehicleID, 'inspections', inspectionID, 'statusHistory')
```

### requests

```typescript
// Create (Finder)
const requestsRef = collection(db, 'requests');
const docRef = await addDoc(requestsRef, payload);

// Direct read
doc(db, 'requests', requestID)
```

**Status machine:**
`sending` → `open` → `pending` → `accepted` → `to_sign` → `signed` → `execution` → `cancelled`

**contract_status machine:**
`draft` → `preparing_list` → `sent_list` → `review_documents` → `request_changes` → `to_sign` → `signed`

Never transition status from client directly — write the new status value and let triggers propagate to `vendor_requests`.

### vendor_requests

```typescript
// Carrier's incoming requests (onSnapshot safe — bounded by vendor scope)
collection(db, 'vendor_requests', vendorID, 'requests')

// Enrich with full request data
const vendorRequest = snapshotDoc.data();
if (vendorRequest.requestRef) {
  const fullRequest = (await getDoc(vendorRequest.requestRef)).data();
}
```

Key fields: `requestID`, `requestRef` (DocumentReference), `status`, `contract_status`, `offer`, `matchedRoutes`

**Never write to vendor_requests from the carrier client.** Status changes must go through `requests/{id}` and propagate via triggers.

### channels (IMChat)

```typescript
// Channel doc (metadata + last message)
doc(db, 'channels', channelID)

// Live messages — safe for onSnapshot (max 50 docs)
collection(db, 'channels', channelID, 'messages_live')
```

**All writes through Cloud Functions.** Never call `addDoc`/`setDoc` on channels or messages directly from a client hook.

```typescript
// Use callable functions
const { insertMessage, createChannel, listMessages } = ChatFunctions();
await insertMessage({ channelID, message });
```

Message fields: `_id`, `content`, `media`, `senderID`, `createdAt`, `readUserIDs`, `translations`, `language`

**NEVER listen to `messages_historical`**. It is unbounded. Paginate via `listMessages` callable.

### channelsAI

Same schema and rules as `channels`. Separate collection for AI-powered conversations.

```typescript
// Same access pattern — use ChatFunctions() from chatRef.ts
// Functions: createChannelAI, insertMessageAI, listChannelsAI
```

### social_feeds

```typescript
// User's chat feed (home screen list) — onSnapshot safe
collection(db, 'social_feeds', userID, 'chat_feed_live')

// Direct access from chatRef.ts
DocRef(userID).chatFeedLive   // = collection(db, 'social_feeds', userID, 'chat_feed_live')
DocRef(userID).socialFeedDoc  // = doc(db, 'social_feeds', userID)
```

Never write to social_feeds from client. Written by `hydrateChatFeedsForAllParticipants` inside `insertMessage`.

### project_channels / projects / jobs

```typescript
// Project channel container
doc(db, 'project_channels', channelID)

// Project (channelID = {finderID}_{carrierID}, projectID = requestID)
doc(db, 'project_channels', channelID, 'projects', projectID)

// Jobs — direct access
doc(db, 'project_channels', channelID, 'projects', projectID, 'jobs', jobID)

// Jobs — collectionGroup (cross-project queries)
collectionGroup(db, 'jobs')

// Carrier: all jobs for vendor
query(collectionGroup(db, 'jobs'), where('vendorID', '==', vendorID))

// Driver: active jobs
query(
  collectionGroup(db, 'jobs'),
  where('assignedDriverID', '==', driverID),
  where('status', 'in', ['scheduled', 'assigned', 'in_progress'])
)
```

**Resolving channelID and projectID from a job doc:**

```typescript
const projectRef = jobDocSnap.ref.parent.parent;      // projects/{projectID}
const channelRef = projectRef?.parent?.parent;         // project_channels/{channelID}
const projectID = projectRef?.id;
const channelID = channelRef?.id;
```

Job status machine: `scheduled` → `assigned` → `in_progress` → `completed` | `cancelled`

### logitruck_investor_agent_sessions (landing AI)

```typescript
// Session doc (upsert — merge: true)
const sessionRef = db.collection('logitruck_investor_agent_sessions').doc(sessionId);
await sessionRef.set({ id: sessionId, source, updatedAt, createdAt }, { merge: true });

// Save turn
await sessionRef.collection('turns').add({ role, text, source, clientTimestamp, createdAt });

// Read all turns (ordered)
sessionRef.collection('turns').orderBy('clientTimestamp', 'asc').get()

// Analysis result
await sessionRef.collection('analysis').add(analysisData);
```

Accessed only from Cloud Functions (`saveLogiTruckInvestorTurn`, `finalizeInvestorSession`). Never from the mobile app or React web client directly.

---

## live/historical Split Rule

`collections.js` manages `_live` / `_historical` subcollection pairs for any collection passed through its `add/getList/remove` helpers:

| Subcollection | Limit | onSnapshot | Paginated read |
|--------------|-------|-----------|----------------|
| `*_live` | 50 docs | ✅ Safe | `getList(ref, name, -1, 0)` |
| `*_historical` | Unbounded | ❌ Never | `getList(ref, name, page, size)` |

Affected collections: `channels/*/messages`, `channelsAI/*/messages`, `social_feeds/*/chat_feed`

---

## Write Ownership Rules

| Collection | Who writes | Who must NOT write |
|-----------|-----------|-------------------|
| `vendors` | `createCarrier` callable (Cloud Function) | Any client hook |
| `users` | Auth user (self), profile update hook | Other users |
| `vendor_users/.../users` | Same user (mirror), propagateUserProfileUpdates trigger | Any other client |
| `vendor_vehicles/.../vehicles` | Carrier dispatcher (job assignment fields) | Driver (read-only) |
| `vendor_vehicles/.../inspections` | `useInspectionReportMutations` (dispatcher) | Driver, triggers |
| `carrier_inspections/.../inspections` | `useInspectionReportMutations` + inspection trigger | Client directly |
| `vendor_vehicles/.../inspections/.../statusHistory` | Inspection trigger ONLY | Any client |
| `requests` | Finder (create), triggers (status propagation) | Carrier |
| `vendor_requests/.../requests` | `distributeRequest` trigger + `onRequestUpdated` trigger | Any client |
| `channels` | Cloud Functions only | Any client hook |
| `social_feeds` | `hydrateChatFeedsForAllParticipants` (Cloud Function) | Any client |
| `project_channels` | `onRequestUpdated` trigger (signed status) | Any client |
| `project_channels/.../jobs` | `onSetupFlagWritten` trigger | Client (read-only from driver/carrier) |
| `logitruck_investor_agent_sessions` | Landing Cloud Functions only | Mobile app |

---

## Denormalization Rules

Three denormalized pairs exist. When generating code that writes to the source, the factory must also write to the index:

### 1. User profile → vendor_users

Source: `users/{uid}` — Index: `vendor_users/{vendorID}/users/{uid}`

Generate both writes. See `useUpdateUserProfile` for the canonical pattern.

### 2. Inspection → carrier_inspections

Source: `vendor_vehicles/{v}/vehicles/{id}/inspections/{id}` — Index: `carrier_inspections/{v}/dispatchers/{d}/inspections/{id}`

Generate both writes in `useInspectionReportMutations`. The trigger also mirrors — do not add a third write path.

### 3. request → vendor_requests

Source: `requests/{id}` — Index: `vendor_requests/{v}/requests/{id}`

Generated only by Cloud Function triggers. Client must never replicate this sync.

---

## collectionGroup Safety Rules

`collectionGroup(db, 'jobs')` spans ALL `jobs` subcollections across ALL parents.

- Always filter immediately: `where('vendorID', '==', vendorID)` or `where('assignedDriverID', '==', driverID)`.
- Requires Firestore composite index — do not generate collectionGroup queries without the matching index declaration.
- `collectionGroup(db, 'requests')` is used by triggers — **do not use from client**. It would match both `vendor_requests/.../requests` and any other `requests` subcollection.

---

## Anti-Patterns

```typescript
// ❌ Reading parent container doc
doc(db, 'vendor_users', vendorID)  // always empty

// ❌ Snapshot on unbounded subcollection
onSnapshot(collection(db, 'channels', id, 'messages_historical'), ...)

// ❌ Writing to vendor_requests from client
setDoc(doc(db, 'vendor_requests', vendorID, 'requests', requestID), ...)

// ❌ Writing to social_feeds from client
setDoc(doc(db, 'social_feeds', userID, 'chat_feed_live', channelID), ...)

// ❌ Writing inspectionSummary directly on vehicle doc
updateDoc(vehicleRef, { inspectionSummary: { ... } })  // trigger owns this field

// ❌ collectionGroup without filter
collectionGroup(db, 'requests')  // matches vendor_requests AND any other requests subcollection
```

---

## When to Load This Building Block

Load `firestore-data-model-access` whenever a feature generates:

- Firestore reads/writes for any of the collections above
- Hook patterns that need to know vendorID resolution
- Cloud Function access to Firestore collections
- Any query that involves `vendors`, `vendor_users`, `vendor_vehicles`, `requests`, `vendor_requests`, `project_channels`, `channels`, or `carrier_inspections`

This building block is a companion to `hook-service-pattern` and `realtime-firestore-listener`. Use them together.
