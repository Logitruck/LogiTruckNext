# Building Block: Trip Status Machine

## Pattern Summary

A LogiTruck trip request moves through two parallel status machines: `status` (the logistics workflow from open to execution) and `contract_status` (the document/contract workflow from draft to signed). Status transitions are enforced server-side in Cloud Function triggers. The client writes new statuses; the server applies cascading effects.

---

## Problem Being Solved

A trip request involves two companies (finder + carrier), multiple documents (offers, contracts, checklists), and several Firestore collections (`requests`, `vendor_requests`, `projects`, `project_channels`). No single client write can atomically update all affected documents. The status machine ensures all downstream collections stay consistent when the main request transitions.

---

## Status Fields

### `status` — logistics workflow

```
open → pending → preparation → accepted → to_sign → signed → execution
```

| Status | Meaning | Who sets it |
|---|---|---|
| `open` | Request created, awaiting distribution | `Request.js` model constructor |
| `pending` | Distributed to vendors, awaiting offers | `distributeRequest.js` trigger |
| `preparation` | (intermediate — document prep phase) | Client |
| `accepted` | A vendor offer has been accepted | `acceptVendorOffer` callable |
| `to_sign` | Documents approved, ready for signature | Client after document review |
| `signed` | Contract signed by both parties | Client / signature flow |
| `execution` | Project started, routes active | `onRequestUpdated.js` trigger on 'signed' |
| `cancelled` | Cancelled by any party | `cancelRequest` callable |

### `contract_status` — document workflow

```
draft → preparing_list → waiting_list → sent_list → review_documents → request_changes → to_sign → signed
```

| Status | Meaning | Who sets it |
|---|---|---|
| `draft` | Initial, no documents yet | Implicit (request creation) |
| `preparing_list` | Finder is assembling document list | `onRequestUpdated` on 'accepted' |
| `waiting_list` | Carrier waiting for document list | Set on vendor_request when accepted |
| `sent_list` | Finder has sent document list to carrier | Client |
| `review_documents` | Carrier reviewing documents | Client |
| `request_changes` | Carrier requested document changes | Client |
| `to_sign` | All documents approved | `onRequestUpdated` on status 'to_sign' |
| `signed` | Contract signed | Signature flow |

---

## State Machine Source of Truth

### Request model — initial state

```js
// LogiTruckNet/src/features/requests/models/Request.js
export class Request {
  constructor({ createdBy, vendorID, origin, destination, cargo, rideType, ... }) {
    if (!origin?.lat || !origin?.lon) throw new Error('Missing origin coordinates');
    if (!rideType?.id) throw new Error('Missing rideType ID');
    if (!createdBy?.userID) throw new Error('Missing createdBy.userID');

    this.status = 'open';         // ← initial status always 'open'
    this.createdAt = new Date();
    // ...
  }

  toFirestore() {
    return { status: this.status, createdAt: this.createdAt, ... };
  }
}
```

Every request starts as `'open'`. The `Request` model validates required fields before creating the Firestore document.

---

## Transition: open → pending (distributeRequest trigger)

```js
// LogiFunctionsV2/functions/distributeRequest/distributeRequest.js
// onDocumentCreated('requests/{requestID}')

// 1. Geo + category matching
const matchingVendors = await findMatchingVendors(requestData);

// 2. Fan-out: create vendor_requests for each matched vendor
for (const vendor of matchingVendors) {
  await db.collection('vendor_requests').doc(vendor.id)
    .collection('requests').doc(requestID)
    .set({ requestID, status: 'pending', ... });
}

// 3. Advance main request to 'pending'
await db.collection('requests').doc(requestID)
  .update({ status: 'pending', distributedAt: FieldValue.serverTimestamp() });

// 4. Send push notifications to matched vendors
await sendPushNotifications(matchingVendors, requestData);
```

---

## Transition: pending → accepted (acceptVendorOffer callable)

The finder selects a vendor offer. The callable:
1. Validates the request is in `pending` state
2. Sets `status = 'accepted'` and `confirmedVendor = vendorID` on the request
3. Triggers `onRequestUpdated` which closes competing offers

---

## Transition: accepted → (onRequestUpdated trigger)

```js
// onRequestUpdated.js — case 'accepted'
case 'accepted':
  // Advance contract workflow on main request
  await requestRef.update({ contract_status: 'preparing_list', ... });

  // Advance confirmed vendor's vendor_request
  await vendorRequestRef.update({
    status: 'accepted',
    contract_status: 'waiting_list',
    ...
  });

  // Close all competing vendor_requests via batch
  vendorSnapshot.forEach(docSnap => {
    if (docSnap.ref.parent.parent?.id !== confirmedVendor) {
      batch.update(docSnap.ref, { status: 'closed', ... });
    }
  });
  await batch.commit();
  break;
```

---

## Transition: to_sign → (onRequestUpdated trigger)

```js
case 'to_sign':
  // Propagate to_sign to vendor_request
  await vendorRequestRef.update({
    status: 'to_sign',
    contract_status: 'to_sign',
    ...
  });
  break;
```

---

## Transition: signed → execution (onRequestUpdated trigger — most complex)

```js
case 'signed':
  // 1. Advance both request and vendor_request to 'execution'
  await Promise.all([
    requestRef.update({ status: 'execution', ... }),
    vendorRequestRef.update({ status: 'execution', ... }),
  ]);

  // 2. Build project routes from accepted offer
  const projectRoutes = matchedRoutes.map((route, index) => ({
    id: route.id,
    origin: route.origin,
    destination: route.destination,
    pricePerTrip: relatedRouteOffer?.pricePerTrip ?? 0,
    tripsOffered: relatedRouteOffer?.tripsOffered ?? 0,
    ...
  }));

  // 3. Create project_channel document
  const channelID = `${finderID}_${confirmedVendor}`;
  await projectChannelRef.set({
    companiesParticipants: [...],
    finderID, carrierID: confirmedVendor,
    ...
  }, { merge: true });

  // 4. Create project document
  await projectRef.set({
    requestID, finderID, carrierID: confirmedVendor,
    status: 'setup',
    routes: projectRoutes,
    totalRoutes, totalTrips, acceptedOffer,
    assignedFinder,
    ...
  });
  break;
```

The `'signed'` transition creates the project and collaboration channel. This is the most write-intensive transition and produces the operational objects that drivers and dispatchers interact with.

---

## contract_status Propagation Map

When the main request's `contract_status` changes, the trigger propagates a mapped value to the vendor's `vendor_request`:

```js
// onRequestUpdated.js — contract_status block
const updateMap = {
  sent_list: 'send_documents',       // finder sent docs → carrier action
  review_documents: 'review_documents',
  request_changes: 'review_changes',
};

const vendorNewStatus = updateMap[newContractStatus];
if (vendorNewStatus) {
  await vendorRequestRef.update({ contract_status: vendorNewStatus, ... });
}
```

The carrier sees a translated status (`send_documents`, `review_documents`, `review_changes`) while the finder sees the canonical status (`sent_list`, `review_documents`, `request_changes`). The mapping normalises terminology between the two roles.

---

## Status Displayed in Screens

```js
// MyRequestsScreen.js — status displayed directly
<Text>{localized('Status')}: {request.status}</Text>
```

No status-to-label mapping is applied in the screen. `localized()` is used, meaning translation keys for each status string should exist in the i18n files.

---

## Cancelled Transition

```js
case 'cancelled':
  const snapshot = await db
    .collectionGroup('requests')
    .where('requestID', '==', requestID)
    .get();

  const batch = db.batch();
  snapshot.forEach(docSnap => {
    batch.update(docSnap.ref, { status: 'cancelled', ... });
  });
  await batch.commit();
  break;
```

Cancellation is a fan-out: all `vendor_requests` across all vendors that reference this `requestID` are set to `'cancelled'`. The `requestID` field must be stored in every `vendor_request` document for the `collectionGroup` query to work.

---

## Collection Schema Summary

```
requests/{requestID}
  status: 'open' | 'pending' | 'preparation' | 'accepted' | 'to_sign' | 'signed' | 'execution' | 'cancelled'
  contract_status: 'draft' | 'preparing_list' | 'waiting_list' | 'sent_list' | 'review_documents' | 'request_changes' | 'to_sign' | 'signed'
  confirmedVendor: vendorID (set when accepted)
  finderID: vendorID of the finder company

vendor_requests/{vendorID}/requests/{requestID}
  requestID: (denormalised for collectionGroup query)
  status: (mirrors main request status for this vendor)
  contract_status: (carrier-side mapped status)
  offer: { pricePerTrip, routeOffers, totalTrips, ... }

project_channels/{channelID}
  finderID, carrierID, companiesParticipants

project_channels/{channelID}/projects/{requestID}
  requestID, status: 'setup', routes, totalRoutes, totalTrips, acceptedOffer
```

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Client writing `status = 'execution'` directly | Must go through trigger; bypasses project creation |
| Skipping `previousStatus !== newStatus` check | Every Firestore write re-fires the trigger; without the guard, all status actions run on every field update |
| Not storing `requestID` in vendor_request docs | `collectionGroup` cancel query will fail silently |
| Using non-canonical status strings | Client and server must agree on exact strings |
| Creating project before status = 'signed' | Project should only exist once both parties have signed |

---

## Factory Governance

- Factory generates Cloud Functions handling status transitions into `/tmp` clone
- Every status transition handler must check `previousStatus !== newStatus`
- `cancelled` transitions must use `collectionGroup` + batch writes
- `signed` transition must create both `project_channel` and `project` documents
- Status string constants must come from a shared constants file, not be scattered as inline strings
- Claude Code owns review, testing, and deployment — factory never deploys
