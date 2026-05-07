# Building Block: Callable Auth Pattern

## Purpose

Documents the complete authentication and authorization pattern for `onCall` Cloud Functions v2 in LogiTruck: auth extraction, input validation, ownership checks, role-based guards, and the distinction between the correct v2 signature and the broken v1 signature that exists in `stripeconnect.js`.

---

## Operational Problem Solved

Callable functions execute with Firebase Admin SDK privileges (no security rules). Any business write that bypasses Firestore security rules must be authorized server-side. Without an explicit auth check as the first statement, unauthenticated clients can execute any write the function performs.

---

## Real Examples from Codebase

| File | Auth pattern | Guard type |
|---|---|---|
| `distributeRequest/acceptVendorOffer.js` | `request.auth?.uid` + HttpsError | Auth + precondition |
| `jobs/assignCarrierProjectJob.js` | `request.auth` presence check | Auth only |
| `tickets/processJobTicket.js` | `req.auth` presence check | Auth only |
| `distributeRequest/sendChecklist.js` | `request.auth?.uid` + ownership check | Auth + ownership |
| `chat/chatv2.js` | `validateRequiredFields()` helper | Input validation helper |
| `stripe/stripeconnect.js` | `data.auth.uid` **(BROKEN — v1 pattern)** | **Risk** |

---

## Canonical v2 Auth Pattern

```js
// From acceptVendorOffer.js and assignCarrierProjectJob.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');

exports.myCallable = onCall(async (request) => {
  // 1. Auth check — FIRST statement, before any other logic
  const authUID = request.auth?.uid;
  if (!authUID) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // 2. Input extraction and validation
  const { entityID, field } = request.data;
  if (!entityID || !field) {
    throw new HttpsError('invalid-argument', 'Missing required fields: entityID, field');
  }

  // 3. Firestore read + precondition checks
  const snap = await db.collection('entities').doc(entityID).get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Entity ${entityID} not found`);
  }

  const data = snap.data();
  if (data.status !== 'open') {
    throw new HttpsError('failed-precondition', `Entity is not in open state: ${data.status}`);
  }

  // 4. Business writes
  await snap.ref.update({ status: 'processed', updatedAt: FieldValue.serverTimestamp() });

  // 5. Return
  return { success: true, entityID };
});
```

---

## Input Validation Helper

`chat/chatv2.js` extracts the validation loop into a reusable function:

```js
function validateRequiredFields(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      throw new HttpsError('invalid-argument', `${key} is required.`);
    }
  }
}

// Usage:
const { channelID, userID } = req.data;
validateRequiredFields({ channelID, userID });
```

Use this helper when validating 3+ fields to avoid repeated `if (!field)` checks.

---

## Ownership Check Pattern

```js
// From sendChecklist.js — verifying the caller owns the resource
const requestData = requestDoc.data();
if (requestData.createdBy?.userID !== authUID) {
  throw new HttpsError('permission-denied', 'You do not own this request');
}
```

Always check ownership AFTER the existence check. If the document does not exist, throw `not-found` before `permission-denied` to avoid leaking information about which documents exist.

---

## Confirmed Vendor Guard Pattern

```js
// From onVendorRequestUpdated.js — confirming the caller is the designated vendor
const isConfirmedVendor = requestData?.confirmedVendor === vendorID;
if (!isConfirmedVendor) {
  logger.warn(`⚠️ Vendor ${vendorID} is not confirmed for request ${requestID}`);
  return;
}
```

Used when a write must only be executed by a specific party — the confirmed carrier in a deal. This is NOT equivalent to ownership: it checks business role, not auth identity.

---

## Multi-Document Parallel Read Pattern

```js
// From assignCarrierProjectJob.js — reads 6 documents before any write
const [
  driverSnap,
  dispatcherSnap,
  truckSnap,
  trailerSnap,
  previousTruckSnap,
  previousTrailerSnap,
] = await Promise.all([
  driverRef.get(),
  dispatcherRef ? dispatcherRef.get() : Promise.resolve(null),
  truckRef.get(),
  trailerRef ? trailerRef.get() : Promise.resolve(null),
  previousTruckRef ? previousTruckRef.get() : Promise.resolve(null),
  previousTrailerRef ? previousTrailerRef.get() : Promise.resolve(null),
]);

// Then validate each
if (!driverSnap.exists) throw new HttpsError('not-found', `Driver ${driverID} not found`);
if (!truckSnap.exists) throw new HttpsError('not-found', `Truck ${truckID} not found`);
```

`Promise.all` minimizes round-trips. Use it whenever multiple independent documents must be read before writing. Validate existence on each snap AFTER the parallel read resolves.

---

## HttpsError Code Reference

| Code | When to throw |
|---|---|
| `unauthenticated` | `request.auth` is null or `.uid` is missing |
| `invalid-argument` | Required field is missing, wrong type, or invalid value |
| `not-found` | Document doesn't exist |
| `failed-precondition` | Document exists but state disallows the operation |
| `permission-denied` | Caller authenticated but doesn't own/have rights to the resource |
| `already-exists` | Would create a duplicate |
| `internal` | Catch-all for unexpected errors (wrap in catch block) |

---

## BROKEN Pattern — v1 Signature in stripeconnect.js

```js
// stripe/stripeconnect.js — BROKEN v1 pattern
exports.createStripeAccount = onCall(async (data) => {  // ← parameter named 'data', not 'request'
  if (!data.auth || !data.auth.uid) {                   // ← data.auth is undefined in v2
    throw new Error("No autorizado.");                  // ← plain Error, not HttpsError
  }
  const email = data.email || data.auth.token.email;    // ← data.email, not data.data.email
});
```

**In Firebase Functions v2 `onCall`:**
- The single parameter is the full `request` object
- Auth is at `request.auth` (not `data.auth` — `data` is undefined as auth container)
- Input data is at `request.data` (not the top-level parameter)

The current `stripeconnect.js` auth check `data.auth.uid` returns `undefined`, meaning **unauthenticated calls bypass the auth guard entirely**. This is an active security vulnerability.

**Correct v2 version:**
```js
exports.createStripeAccount = onCall(async (request) => {
  const authUID = request.auth?.uid;
  if (!authUID) throw new HttpsError('unauthenticated', 'Auth required');
  const { email } = request.data;  // input on request.data
});
```

---

## Auth Token Claims

For role-based access beyond ownership:

```js
const role = request.auth?.token?.role;        // custom claim set via Admin SDK
const email = request.auth?.token?.email;      // from Firebase Auth
const isAdmin = request.auth?.token?.admin === true;
```

Custom claims are set server-side via `admin.auth().setCustomUserClaims(uid, { role: 'admin' })`. LogiTruck currently does not use custom claims for function authorization — all role checks are done by reading Firestore documents.

---

## Retry and Idempotency

`onCall` functions are not automatically retried by Firebase. If a client times out and retries, the function may execute twice. For state-changing operations (creating records, sending notifications), guard against re-execution:

```js
// Pattern from stripeconnect.js — idempotency via Firestore read
const userDoc = await db.collection('stripe_accounts').doc(userId).get();
if (userDoc.exists && userDoc.data().chargesEnabled) {
  return { message: 'Already configured', accountId: ... };  // early return, no re-creation
}
```

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `async (data) => { data.auth.uid }` | v1 signature — `data.auth` is undefined in v2 |
| Auth check after first Firestore read | Unauthenticated caller executes a read before being rejected |
| `throw new Error(...)` instead of `HttpsError` | Client receives opaque INTERNAL error, loses the error code |
| Checking `.exists` then accessing `.data()` outside the check | Race condition if doc deleted; check and use together |
| Not checking `isConfirmedVendor` before writing to vendor-scoped docs | Non-confirmed vendor can write to another vendor's resources |

---

## Testing Guidance

```
GIVEN request.auth is null
WHEN the function executes
THEN HttpsError('unauthenticated') is thrown before any Firestore read

GIVEN required input field is missing
WHEN validateRequiredFields runs
THEN HttpsError('invalid-argument') names the missing field

GIVEN the target document does not exist
WHEN existence is checked
THEN HttpsError('not-found') is thrown before any writes

GIVEN caller does not own the resource
WHEN ownership is checked
THEN HttpsError('permission-denied') is thrown

GIVEN the function is called twice with the same input
WHEN idempotency guard checks Firestore state
THEN the second call returns success without duplicating side effects
```

---

## Factory Governance

- Factory uses ONLY `request.auth?.uid` — never `data.auth`
- Auth check is the first executable statement, before any Firestore operation
- Every error path throws `HttpsError` with the correct typed code
- Idempotency guard (Firestore read + early return) required for all state-creating functions
- Claude Code audits auth pattern and fixes `stripeconnect.js` v1 signature before production use
