# LogiTruck Testing Guide

## Purpose

Testing in LogiTruck Factory protects the repository from AI-generated regressions.

Every generated implementation must be test-first whenever possible.

---

# Testing Stack

LogiTruckNext uses:

- Jest
- jest-expo
- TypeScript
- @testing-library/react-native
- react-test-renderer pinned to React version

Do not introduce a new testing framework unless explicitly approved.

---

# Install Command for Factory Sandbox

Use:

```bash
NODE_ENV=development npm install --include=dev --legacy-peer-deps
```

Do not use plain `npm install` inside factory sandbox.

---

# Validation Commands

```bash
./node_modules/.bin/jest <target-test-path-or-folder> --watchAll=false --forceExit
./node_modules/.bin/tsc --noEmit
```

---

# Core Rules

## Pure utilities

For pure functions/utilities:

- Do NOT use `renderHook`
- Do NOT use React Testing Library
- Import function directly
- Test inputs, outputs and edge cases

Example:

```ts
import { milesToKm } from '../milesToKm';

expect(milesToKm(1)).toBe(1.61);
```

---

## React hooks

Use `renderHook` only when the implementation actually uses React behavior:

- useState
- useEffect
- useMemo
- useCallback
- context
- subscriptions

Use:

```ts
import { renderHook, waitFor, act } from '@testing-library/react-native';
```

Never use:

```ts
@testing-library/react-hooks
```

---

# Firestore Hook Testing

Firestore hooks must mock:

- collection
- doc
- query
- where
- orderBy
- getDoc
- getDocs
- onSnapshot

Pattern:

```ts
mockOnSnapshot.mockImplementation((ref, onNext) => {
  onNext({ docs: [] });
  return mockUnsubscribe;
});
```

Always verify cleanup:

```ts
act(() => unmount());
expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
```

---

## CRITICAL: Three required patterns for Firestore hook tests in React Native

These three mistakes cause 100% test failure. Apply all three to every generated hook test.

### 1. Named import — never default import

Hooks in this repo use named exports (`export function useX`), not `export default`.

```ts
// CORRECT
import { useVendorLocations } from '../useVendorLocations';

// WRONG — resolves .default to undefined → TypeError: (0 , _hook.default) is not a function
import useVendorLocations from '../useVendorLocations';
```

### 2. firebase/firestore — always use factory mock form

`firebase/firestore` is ESM. Jest cannot auto-mock ESM — all imports become undefined.

```ts
// CORRECT — list every function the hook imports
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  onSnapshot: jest.fn(),
}));

// WRONG — auto-mock silently makes everything undefined
jest.mock('firebase/firestore');
```

### 3. useCurrentUser — stable object reference required

`useCurrentUser()` result is a `useEffect` dependency. A new object on every call triggers infinite re-renders → "Maximum update depth exceeded".

```ts
// CORRECT — stableReturn is created once, same reference every call
jest.mock('../../../core/onboarding/hooks/useAuth', () => {
  const stableReturn = { user: { uid: 'test-user' } };
  return { useCurrentUser: jest.fn(() => stableReturn) };
});

// WRONG — new object each render → infinite useEffect loop
jest.mock('../../../core/onboarding/hooks/useAuth', () => ({
  useCurrentUser: jest.fn(() => ({ user: { uid: 'test-user' } })),
}));
```

### Import depth from `__tests__/` subfolder

Test files at `src/<role>/hooks/__tests__/` are **one level deeper** than the hook file.

```ts
// CORRECT — from src/carrier/hooks/__tests__/
import { db } from '../../../core/firebase/config';   // 3 levels up

// WRONG — only goes up to src/carrier/hooks/, misses the __tests__/ level
import { db } from '../../core/firebase/config';      // 2 levels up
```

### Complete correct mock block for a Firestore realtime hook test

```ts
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useVendorLocations } from '../useVendorLocations'; // named import

const mockUnsubscribe = jest.fn();
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockCollection = collection as jest.Mock;

jest.mock('firebase/firestore', () => ({          // factory form — ESM
  collection: jest.fn(),
  onSnapshot: jest.fn(),
}));
jest.mock('../../../core/firebase/config', () => ({ db: {} }));  // 3 levels up
jest.mock('../../../core/onboarding/hooks/useAuth', () => {      // stable ref
  const stableReturn = { user: { uid: 'test-user' } };
  return { useCurrentUser: jest.fn(() => stableReturn) };
});
```

---

# React Native Component Testing

Component tests should verify:

- rendered labels
- buttons
- loading states
- empty states
- error states
- callback execution

Avoid testing:

- implementation internals
- style object equality unless style is business-critical
- native map rendering
- native camera behavior
- native PDF rendering

---

# Maps and Tracking Testing

For map/tracking features:

Test only JS logic in factory:

- route adapter output
- polyline parsing
- deviation detection
- ETA formatting
- location throttling
- state transitions

Do NOT test:

- real GPS
- native Mapbox rendering
- native Google Maps rendering
- iOS/Android background behavior

Those require Claude Code and simulator/device validation.

---

# AI / Voice Agent Testing

For AI and voice integrations:

Factory may test:

- prompt assembly
- payload shape
- session state transitions
- webhook handler shape
- Firestore persistence helpers

Factory must NOT test real:

- ElevenLabs audio
- OpenAI realtime sessions
- production API keys
- phone calls

Use mocked API clients.

---

# Cloud Function Testing

Cloud Function tests run in a plain Node.js Jest environment (`testEnvironment: 'node'`).
They use CommonJS (`require`), no Babel transform, no TypeScript.

## CRITICAL: Always mock firebase-functions/v2/https

Do NOT import the real `firebase-functions` package in tests.
The real package triggers an import chain through `firebase-admin` internals
(`../utils/error`, etc.) that Jest intercepts incorrectly and breaks the test suite.

Always add this mock at the top of every Cloud Function test file:

```js
jest.mock('firebase-functions/v2/https', () => ({
  onCall: (handler) => handler,
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));
```

Then require `HttpsError` from the mock, not from the real package:

```js
const { HttpsError } = require('firebase-functions/v2/https');
```

## Import depth for functions/__tests__

Test files live at `functions/app/<module>/__tests__/`.
Shared utilities live at `functions/core/` and `functions/utils/`.

The correct relative import depth from `__tests__/` to `functions/core/` is **three levels up**:

```js
// CORRECT — from functions/app/<module>/__tests__/
const { getUserByEmailSafe } = require('../../../core/user');

// WRONG — only goes up to functions/app/, not functions/
const { getUserByEmailSafe } = require('../../core/user');
```

## Required mocks for Cloud Function tests

Every Cloud Function test must mock:

- `firebase-admin` — provide `auth()` and `firestore()` stubs
- `firebase-functions/v2/https` — inline HttpsError class (see above)
- `uuid` — return deterministic ID for assertions
- Any `functions/core/` dependency used by the function

## firebase-admin mock — FieldValue is a static property

`admin.firestore.FieldValue.serverTimestamp()` is a **static property on the `firestore` function**,
not on its return value. Use module-level variables so the mocks are reachable in test bodies:

```js
const mockServerTimestamp = jest.fn(() => 'mock-server-timestamp');

const mockDb = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      set: jest.fn().mockResolvedValue(undefined),
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          set: jest.fn().mockResolvedValue(undefined),
        }),
      }),
    }),
  }),
};

const mockAuth = {
  createUser: jest.fn().mockResolvedValue({ uid: 'mock-uid' }),
};

const mockFirestore = jest.fn(() => mockDb);
mockFirestore.FieldValue = {
  serverTimestamp: mockServerTimestamp,
};

jest.mock('firebase-admin', () => ({
  firestore: mockFirestore,
  auth: jest.fn(() => mockAuth),
}));
```

These variables are defined BEFORE `jest.mock()` in execution order (no Babel hoisting needed),
so the factory closure captures the correct references. They are also accessible in `beforeEach`
and test bodies for assertions like `expect(mockServerTimestamp).toHaveBeenCalled()`.

WRONG (FieldValue inside return value — does NOT work):
```js
firestore: () => ({ FieldValue: { serverTimestamp: () => 'TIMESTAMP' }, ... })
```

## Modular Firebase Admin SDK mocking (firebase-admin/firestore, firebase-admin/auth)

When the Cloud Function under test uses the **modular Firebase Admin SDK**:
```js
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
```

Mocking `firebase-admin` alone does NOT intercept these calls — `firebase-admin/firestore`
and `firebase-admin/auth` are **separate module paths** that need their own `jest.mock()`.

**DO NOT mock `firebase-admin` at all when the function uses modular imports.**
Mock the modular paths directly instead:

```js
const mockServerTimestamp = jest.fn(() => 'mock-server-timestamp');

const mockDocSet = jest.fn().mockResolvedValue(undefined);
const mockDb = {
  collection: jest.fn().mockImplementation((name) => ({
    doc: jest.fn().mockReturnValue({
      set: mockDocSet,
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({ set: mockDocSet }),
      }),
    }),
  })),
};

const mockAuthCreateUser = jest.fn();
const mockAuthInstance = { createUser: mockAuthCreateUser };

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockDb),
  FieldValue: { serverTimestamp: mockServerTimestamp },
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => mockAuthInstance),
}));
```

This replaces the legacy `jest.mock('firebase-admin', ...)` block entirely for modular-SDK functions.

**Complete ordering for modular SDK Cloud Function tests:**

```js
// ── STEP 1: all jest.mock() calls ─────────────────────────────────────────
jest.mock('firebase-functions/v2/https', () => ({
  onCall: (handler) => handler,
  HttpsError: class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  },
}));

const mockServerTimestamp = jest.fn(() => 'mock-server-timestamp');
const mockDocSet = jest.fn().mockResolvedValue(undefined);
const mockDb = { collection: jest.fn().mockImplementation((name) => ({
  doc: jest.fn().mockReturnValue({
    set: mockDocSet,
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({ set: mockDocSet }),
    }),
  }),
})) };
const mockAuthCreateUser = jest.fn();
const mockAuthInstance = { createUser: mockAuthCreateUser };

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockDb),
  FieldValue: { serverTimestamp: mockServerTimestamp },
}));
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => mockAuthInstance),
}));
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('test-vendor-id-123') }));
jest.mock('../../../core/user', () => ({ getUserByEmailSafe: jest.fn() }));

// ── STEP 2: all require() calls (only after all mocks registered) ──────────
const { HttpsError } = require('firebase-functions/v2/https');
const { createCarrier } = require('../createCarrier');
```

**Decision rule:** look at the `require()` calls in the function file itself:
- Function uses `require('firebase-admin')` → use legacy `jest.mock('firebase-admin', ...)` pattern
- Function uses `require('firebase-admin/firestore')` / `require('firebase-admin/auth')` → use modular mock pattern above

**CRITICAL: Do NOT reassign mockDb or mockAuthInstance in beforeEach.**

When the function has module-level calls like `const db = getFirestore()` or `const auth = getAuth()`,
those execute once at `require('../createCarrier')` time. The `db` and `auth` variables in the function
are permanently bound to `mockDb` and `mockAuthInstance` from that moment.

If `beforeEach` creates a new object and tries to replace them, the function never sees it:
```js
// WRONG — function already captured the original mockDb at require time
beforeEach(() => {
  mockDb = { collection: jest.fn()... };          // ← creates new object, function ignores it
  admin.firestore.mockReturnValue(mockDb);         // ← doesn't exist in modular SDK
});
```

Correct `beforeEach` for modular SDK functions:
```js
beforeEach(() => {
  jest.clearAllMocks();                            // ← resets call counts on existing mocks
  // Re-wire specific mock behaviors if needed:
  mockAuthCreateUser.mockResolvedValue({ uid: 'default-uid' });
});
```

The module-level `mockDb`, `mockAuthInstance`, `mockDocSet` etc. are reused across tests.
`jest.clearAllMocks()` resets their call counts. Specific tests override behaviors with
`.mockResolvedValueOnce()` or `.mockReturnValueOnce()` per test.

---

## Always use mock-prefixed Jest methods

Always use:
- `jest.fn().mockReturnValue(x)` — NOT `.returnValue(x)`
- `jest.fn().mockResolvedValue(x)` — NOT `.resolvedValue(x)`
- `jest.fn().mockRejectedValue(e)` — NOT `.rejectedValue(e)`

The non-prefixed versions (`.returnValue`, `.resolvedValue`) do not exist on jest.fn() and will throw `TypeError: jest.fn(...).returnValue is not a function`.

## CRITICAL: require() order — no Babel hoisting in this project

This project uses `transform: {}` (no Babel). **Jest does NOT hoist `jest.mock()` calls.**
Execution is strictly top-to-bottom.

**Rule: zero `require()` calls before the last `jest.mock()` call.**

If `require('firebase-functions/v2/https')` appears before `jest.mock('firebase-functions/v2/https', ...)`,
the real package loads, triggers the firebase-admin import chain, and the test suite crashes.

**Correct structure — ALL mocks first, ALL requires after:**

```js
// ── STEP 1: all jest.mock() calls (no require before this block) ──────────
jest.mock('firebase-functions/v2/https', () => ({...}));

const mockServerTimestamp = jest.fn(() => 'mock-server-timestamp');
const mockDb = { collection: jest.fn()... };
const mockAuth = { createUser: jest.fn()... };
const mockFirestore = jest.fn(() => mockDb);
mockFirestore.FieldValue = { serverTimestamp: mockServerTimestamp };
jest.mock('firebase-admin', () => ({ firestore: mockFirestore, auth: jest.fn(() => mockAuth) }));

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('test-vendor-id-123') }));
jest.mock('../../../core/user', () => ({ getUserByEmailSafe: jest.fn() }));
// ── STEP 2: all require() calls (only after all mocks are registered) ─────
const { HttpsError } = require('firebase-functions/v2/https');
const { createCarrier } = require('../createCarrier');
const admin = require('firebase-admin');
const { getUserByEmailSafe } = require('../../../core/user');
```

`functions/core/user.js` calls `getFirestore()` at the top level — if it loads before
`jest.mock('firebase-admin')` is registered, the test crashes with `Firebase Admin not initialized`.

---

## Cloud Function jest config

Use a dedicated `jest.functions.config.js` at repo root:

```js
module.exports = {
  testEnvironment: 'node',
  modulePaths: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {},
};
```

Do NOT add `moduleNameMapper` entries — they intercept node_modules internal
relative imports and cause false resolution errors.

---

# Stripe / Payments Testing

Factory may test:

- payload builders
- Cloud Function request validation
- UI state
- webhook parsing helpers with mock payloads

Factory must NOT:

- use production Stripe keys
- create real accounts
- execute live payments
- make compliance assumptions

Stripe Connect production flows require Claude Code and human approval.

---

# Test File Location

Use existing repo conventions:

```txt
src/<role>/hooks/__tests__/
src/modules/<module>/hooks/__tests__/
src/utils/__tests__/
src/services/__tests__/
functions/**/__tests__/
```

---

# Test Quality Rules

A generated test must:

- fail before implementation
- pass after implementation
- assert meaningful behavior
- avoid brittle snapshots
- avoid unnecessary mocks
- include error path when applicable

---

# Factory Retry Rules

Retry is allowed for:

- failing assertion
- TypeScript error
- missing import
- wrong path
- mock setup issue

Escalate to Claude Code for:

- native test environment issue
- dependency conflict
- Firebase emulator requirement
- build failure
- unknown runtime error
