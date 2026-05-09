# Building Block: Cloud Function Feature — Production Patterns

## Purpose

This block defines the production-grade implementation standards for `cloud-function-feature`
archetype. It supplements `callable-function-pattern` with the concrete patterns derived from
the LogiTruck production codebase. Every generated Cloud Function must follow these patterns.

---

## 0. OVERRIDE — These rules supersede callable-function-pattern.md

This building block overrides the `callable-function-pattern` canonical example where they conflict.
Specifically: the Firebase Admin import style and the import depth for `functions/core/` modules.

---

## 1. Firebase Admin SDK Imports — Modular API (REQUIRED)

Always use the modular Firebase Admin SDK. Never use `require('firebase-admin')` directly.

```js
// CORRECT — modular imports (production standard)
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();
const auth = getAuth();
```

```js
// WRONG — legacy namespace SDK (do not generate this)
const admin = require('firebase-admin');
const db = admin.firestore();
// admin.firestore.FieldValue.serverTimestamp()  ← wrong
```

`FieldValue` is imported directly from `firebase-admin/firestore` — not accessed as
`admin.firestore.FieldValue`. Use `FieldValue.serverTimestamp()` directly.

---

## 1b. Import Depth — functions/core/ modules (CRITICAL)

The `functions/` directory structure has two different depths that require different relative paths
to reach `functions/core/`. Using the wrong depth causes a module-not-found error.

```
functions/
  app/
    carrier/
      createCarrier.js        ← FUNCTION FILE (depth: functions/app/carrier/)
      __tests__/
        createCarrier.test.js ← TEST FILE (depth: functions/app/carrier/__tests__/)
  core/
    user.js                   ← TARGET
```

**From the FUNCTION FILE** (`functions/app/carrier/createCarrier.js`):
```js
// 2 levels up: carrier/ → app/ → functions/ → core/user
const { getUserByEmailSafe } = require('../../core/user');  // CORRECT
const { getUserByEmailSafe } = require('../../../core/user'); // WRONG — goes to repo root
```

**From the TEST FILE** (`functions/app/carrier/__tests__/createCarrier.test.js`):
```js
// 3 levels up: __tests__/ → carrier/ → app/ → functions/ → core/user
jest.mock('../../../core/user', () => ({...}));  // CORRECT
jest.mock('../../core/user', () => ({...}));     // WRONG — goes to functions/app/core/user
```

Both `../../core/user` (function) and `../../../core/user` (test) resolve to the same absolute
path `functions/core/user`. They look different but are correct at each depth.

---

## 2. Input Normalization (REQUIRED for user-facing inputs)

Always normalize string inputs before validation. Raw `request.data` values may have
leading/trailing whitespace, wrong case, or unexpected types.

```js
const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeString = (val = '') => String(val || '').trim();
const normalizeRoles = (rolesArray = []) => {
  const validRoles = ['carrier', 'dispatch', 'driver'];
  return [...new Set(
    Array.isArray(rolesArray)
      ? rolesArray.map(r => String(r || '').trim().toLowerCase()).filter(r => validRoles.includes(r))
      : []
  )];
};
const mergeUnique = (arrA = [], arrB = []) => [...new Set([...(arrA || []), ...(arrB || [])])];
```

Always use `request.data || {}` (not `request.data`) when destructuring inputs:
```js
const { vendorID, email, firstName = '', rolesArray = [] } = request.data || {};
const cleanEmail = normalizeEmail(email);
const cleanVendorID = normalizeString(vendorID);
```

---

## 3. User Creation — Temporary Password (REQUIRED)

When creating a Firebase Auth account for a new user, always assign a temporary password.
Never call `createUser` without a `password` field — the account becomes inaccessible.

```js
const TEMP_PASSWORD = 'Temp1234!';

// When creating new Auth user:
const newUser = await auth.createUser({
  email: cleanEmail,
  password: TEMP_PASSWORD,
  displayName: `${cleanFirstName} ${cleanLastName}`.trim(),
  disabled: false,
});

// Flag the user doc so the app forces a password reset on first login:
mustResetPassword: true,
isTemporaryPassword: true,
```

Return the temp password to the caller if a new user was created:
```js
return {
  success: true,
  uid,
  isNewAuthUser,
  tempPassword: isNewAuthUser ? TEMP_PASSWORD : null,
};
```

---

## 4. Firestore Document Field Schemas

### users/{uid}

```js
await db.collection('users').doc(uid).set({
  id: uid,
  userID: uid,                                   // dual ID — both required
  email: cleanEmail,
  firstName: cleanFirstName,
  lastName: cleanLastName,
  phoneNumber: cleanPhoneNumber || existingData?.phoneNumber || '',
  vendorIDs: mergeUnique(existingData?.vendorIDs || [], [vendorID]),  // array, supports multi-vendor
  activeVendorID: existingData?.activeVendorID || vendorID,
  globalRoles: mergedGlobalRoles,                // merged across all vendor memberships
  rolesArray: mergedGlobalRoles,                 // mirror of globalRoles for legacy compatibility
  accountType: 'vendor_user',
  mustResetPassword: true,
  isTemporaryPassword: true,
  status: 'active',
  activeJob: existingData?.activeJob || null,
  updatedAt: FieldValue.serverTimestamp(),
  createdAt: existingData?.createdAt || FieldValue.serverTimestamp(),
}, { merge: true });
```

Key rules:
- Both `id` and `userID` must be written (dual ID — different reads use different fields)
- `vendorIDs` is an **array** — a user can belong to multiple vendors
- `createdAt` preserves the original timestamp if the doc already exists (`existingData?.createdAt || ...`)
- `updatedAt` is always refreshed
- `globalRoles` and `rolesArray` are kept in sync (mirror pattern for compatibility)

### vendor_users/{vendorID}/users/{uid}

```js
await db.collection('vendor_users').doc(vendorID).collection('users').doc(uid).set({
  id: uid,
  userID: uid,       // required
  usersID: uid,      // required — third ID alias used by some queries
  vendorID,
  email: cleanEmail,
  firstName: cleanFirstName,
  lastName: cleanLastName,
  phoneNumber: cleanPhoneNumber || existingVendorData?.phoneNumber || '',
  rolesArray: mergedVendorRoles,
  status: 'active',
  invitedBy: callerUid,                          // always record who created the record
  updatedAt: FieldValue.serverTimestamp(),
  createdAt: existingVendorData?.createdAt || FieldValue.serverTimestamp(),
}, { merge: true });
```

Key rules:
- Three ID aliases required: `id`, `userID`, `usersID`
- `invitedBy` always set to the authenticated caller's UID
- `createdAt` preserved if record already exists

---

## 5. Try/Catch Structure — Wrap Everything

The try/catch must wrap all logic including auth check and validation:

```js
exports.myFunction = onCall(async (request) => {
  try {
    // Auth check — first statement inside try
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    // Input normalization + validation
    const { vendorID, email } = request.data || {};
    const cleanVendorID = normalizeString(vendorID);
    const cleanEmail = normalizeEmail(email);

    if (!cleanVendorID) throw new HttpsError('invalid-argument', 'vendorID is required.');
    if (!cleanEmail) throw new HttpsError('invalid-argument', 'email is required.');

    // Business logic
    // ...

    return { success: true, uid, vendorID };
  } catch (error) {
    console.error(`❌ ${functionName} error:`, error);   // always log
    if (error instanceof HttpsError) throw error;         // re-throw typed errors
    throw new HttpsError('internal', error?.message || 'Unexpected error.');
  }
});
```

Error message access uses `error?.message || 'fallback'` — never `error.message` directly
(crashes if error has no message property).

---

## 6. Vendor Existence Validation

When a function writes to `vendor_users/{vendorID}/`, always validate the vendor exists first:

```js
const vendorSnap = await db.collection('vendors').doc(cleanVendorID).get();
if (!vendorSnap.exists) {
  throw new HttpsError('not-found', 'Vendor not found.');
}
```

---

## 7. Return Shape — Include Diagnostic Fields

Return enough data for the caller to react without a second round-trip:

```js
return {
  success: true,
  uid,
  email: cleanEmail,
  vendorID: cleanVendorID,
  isNewAuthUser,                                 // true if Auth account was created now
  tempPassword: isNewAuthUser ? TEMP_PASSWORD : null,
  globalRoles: mergedGlobalRoles,
  vendorRoles: mergedVendorRoles,
  message: isNewAuthUser
    ? 'User created and linked to vendor successfully.'
    : 'Existing user linked/updated for vendor.',
};
```

---

## 8. Anti-Patterns (NEVER generate these)

| Anti-pattern | Correct alternative |
|---|---|
| `const admin = require('firebase-admin')` | `const { getFirestore } = require('firebase-admin/firestore')` |
| `admin.firestore.FieldValue.serverTimestamp()` | `FieldValue.serverTimestamp()` (imported directly) |
| `auth.createUser({ email, displayName })` without password | Add `password: TEMP_PASSWORD` |
| `vendorID: cleanVendorID` (scalar) on users/{uid} | `vendorIDs: mergeUnique(existing, [vendorID])` (array) |
| Missing `userID` field | Always write both `id` and `userID` |
| Missing `updatedAt` | Always write `updatedAt: FieldValue.serverTimestamp()` |
| `error.message` (direct) | `error?.message || 'fallback'` |
| No `console.error` in catch | Always log before re-throwing |
| Raw `request.data.email` | `normalizeEmail(request.data?.email)` |
