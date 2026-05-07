# Building Block: Callable Function Pattern

## Pattern Summary

`onCall` Firebase Functions v2 expose authenticated business operations to the client apps. The pattern: authenticate via `request.auth?.uid`, validate input, execute business logic with Firestore reads and writes, and return a typed result object. Errors are thrown as `HttpsError` with a typed code — never as plain JS errors.

---

## Problem Being Solved

Some operations require server-side authority: closing competing offers, creating projects, validating permissions the client cannot check. `onCall` functions run in the Firebase infrastructure, have access to Firebase Admin SDK (bypasses security rules), and carry the caller's auth token automatically from the SDK — no manual token management.

---

## Where This Pattern Appears in the Codebase

| File | Function name | What it does |
|---|---|---|
| `LogiFunctionsV2/functions/distributeRequest/acceptVendorOffer.js` | `acceptVendorOffer` | Validates offer, marks it accepted, batch-closes competing offers |
| `LogiFunctionsV2/functions/distributeRequest/submitVendorOffer.js` | `submitVendorOffer` | Creates or updates a vendor offer on a request |
| `LogiFunctionsV2/functions/distributeRequest/rejectVendorOffer.js` | `rejectVendorOffer` | Marks an offer rejected |
| `LogiFunctionsV2/functions/distributeRequest/cancelRequest.js` | `cancelRequest` | Cancels a request and all its vendor_requests |
| `LogiFunctionsV2/functions/distributeRequest/approveVendorsOffer.js` | `approveVendorOffer` | Finder approves a vendor offer after document review |

---

## Canonical Implementation

```js
// LogiFunctionsV2/functions/distributeRequest/acceptVendorOffer.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.acceptVendorOffer = onCall(async (request) => {
  // 1. Auth check — always first
  const authUID = request.auth?.uid;
  if (!authUID) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // 2. Input extraction and validation
  const { requestID, vendorID } = request.data;
  if (!requestID || !vendorID) {
    throw new HttpsError('invalid-argument', 'Missing required fields: requestID, vendorID');
  }

  // 3. Firestore reads — validate preconditions
  const requestRef = db.collection('requests').doc(requestID);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    throw new HttpsError('not-found', `Request ${requestID} not found`);
  }

  const requestData = requestSnap.data();
  if (requestData.status !== 'pending') {
    throw new HttpsError('failed-precondition', `Request is not in pending state: ${requestData.status}`);
  }

  // 4. Business logic — Firestore writes
  const batch = db.batch();

  batch.update(requestRef, {
    status: 'accepted',
    confirmedVendor: vendorID,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // (additional batch operations)

  await batch.commit();

  // 5. Return typed result
  return { success: true, requestID };
});
```

---

## Function Structure — Required Sections

```
1. Auth check          → throw HttpsError('unauthenticated') if auth is missing
2. Input validation    → throw HttpsError('invalid-argument') if data is missing/invalid
3. Precondition reads  → throw HttpsError('not-found' | 'failed-precondition') on bad state
4. Business writes     → batch.commit() or sequential writes
5. Return              → { success: true, ...relevant IDs }
```

Every section must be present. Do not merge sections (e.g., do not validate and write in the same block).

---

## HttpsError Codes Reference

| Code | When to use |
|---|---|
| `unauthenticated` | `request.auth` is null or uid is missing |
| `invalid-argument` | Required field is null, undefined, or wrong type |
| `not-found` | Firestore document does not exist |
| `failed-precondition` | Document exists but is in a state that disallows the operation |
| `permission-denied` | Caller is authenticated but does not own the resource |
| `already-exists` | Operation would create a duplicate |
| `internal` | Unexpected server error (use as catch-all) |

Never throw a plain `Error` from an `onCall` function — the client will receive a generic "INTERNAL" error and lose the specific code. Always use `HttpsError`.

---

## Auth Pattern

```js
const authUID = request.auth?.uid;
if (!authUID) {
  throw new HttpsError('unauthenticated', 'User must be authenticated');
}
```

For ownership checks (user can only update their own resource):
```js
if (requestData.createdBy?.userID !== authUID) {
  throw new HttpsError('permission-denied', 'You do not own this request');
}
```

---

## Input Access

```js
// v2 onCall — data is on request.data
const { requestID, vendorID, offerData } = request.data;

// Auth is on request.auth
const uid = request.auth?.uid;
const email = request.auth?.token?.email;
```

Note: In v1 Firebase Functions, data and auth were separate parameters. In v2, everything is on the `request` object.

---

## Batch Write Pattern

When one callable triggers multiple document updates atomically:

```js
const batch = db.batch();

// Close competing offers
const vendorSnapshot = await db
  .collectionGroup('requests')
  .where('requestID', '==', requestID)
  .get();

vendorSnapshot.forEach((docSnap) => {
  const vendorID = docSnap.ref.parent.parent?.id;
  if (vendorID !== confirmedVendor) {
    batch.update(docSnap.ref, {
      status: 'closed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

await batch.commit();
```

---

## Client-side Invocation (React Native)

```js
// LogiTruckNet / LogiDriver — client call pattern
import functions from '@react-native-firebase/functions';

const acceptVendorOffer = async (requestID, vendorID) => {
  const callable = functions().httpsCallable('acceptVendorOffer');
  const result = await callable({ requestID, vendorID });
  return result.data;  // { success: true, requestID }
};
```

The Firebase client SDK automatically appends the caller's auth token. The function receives it on `request.auth`.

---

## onRequest vs onCall

| Concern | `onCall` | `onRequest` |
|---|---|---|
| Auth | Automatic via Firebase SDK | Manual token verification |
| CORS | Handled by Firebase | Must configure explicitly |
| Client SDK | `functions().httpsCallable(name)` | Plain `fetch` / `axios` |
| Use case | Authenticated business operations | Public webhooks, AI sessions, landing pages |
| Error handling | `HttpsError` codes surfaced to client | HTTP status codes |

Use `onCall` for all authenticated operations where the caller is a signed-in app user. Use `onRequest` for public endpoints, webhook receivers, and AI agent sessions.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Auth check after business logic | Unauthenticated calls can execute writes before the check |
| `throw new Error(...)` instead of `HttpsError` | Client gets opaque INTERNAL error |
| Reading without checking `.exists` | `.data()` on non-existent doc returns `undefined` |
| Awaiting inside `batch.forEach()` | `forEach` does not await Promises; use `Promise.all(docs.map(...))` |
| No return value | Client receives `undefined`; always return at minimum `{ success: true }` |
| Catching `HttpsError` and rethrowing as plain Error | Loses the error code |

---

## Testing Guidance

```
GIVEN request.auth is null
WHEN the function is called
THEN HttpsError('unauthenticated') is thrown before any Firestore read

GIVEN a missing required field
WHEN the function is called
THEN HttpsError('invalid-argument') is thrown

GIVEN the target document does not exist
WHEN the function is called
THEN HttpsError('not-found') is thrown

GIVEN all preconditions pass
WHEN the function executes
THEN all batch writes are committed and { success: true } is returned

GIVEN an unexpected Firestore error
WHEN the function throws
THEN the error is caught, logged, and rethrown as HttpsError('internal')
```

---

## Factory Governance

- Factory generates `onCall` functions into `/tmp` clone only
- Auth check must be the first executable statement inside the handler
- Every error path must throw `HttpsError` with the correct typed code
- No `onCall` function may contain collection path strings — all paths through Admin SDK use collection names from a constants file
- Generated functions are reviewed by Claude Code and deployed by Claude Code, never by the factory
