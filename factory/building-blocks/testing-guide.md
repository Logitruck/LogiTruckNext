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

## Always use mock-prefixed Jest methods

Always use:
- `jest.fn().mockReturnValue(x)` — NOT `.returnValue(x)`
- `jest.fn().mockResolvedValue(x)` — NOT `.resolvedValue(x)`
- `jest.fn().mockRejectedValue(e)` — NOT `.rejectedValue(e)`

The non-prefixed versions (`.returnValue`, `.resolvedValue`) do not exist on jest.fn() and will throw `TypeError: jest.fn(...).returnValue is not a function`.

## Mock modules that initialize Firebase Admin at import time

Some internal modules call Firebase Admin APIs (`getFirestore()`, `getAuth()`, etc.) at
**module load time** — meaning the moment they are `require()`-d, not inside a function call.
If the mock for `firebase-admin` is not in place before those modules load, the test suite
crashes with `Firebase Admin not initialized`.

**Rule:** mock every `functions/core/` module (and any other internal that initializes Firebase
at import time) BEFORE requiring the function under test.

`functions/core/user.js` calls `getFirestore()` at the top level. Always mock it:

```js
jest.mock('../../../core/user', () => ({
  getUserByEmailSafe: jest.fn(),
}));
```

Order of statements in a Cloud Function test file:

1. `jest.mock('firebase-functions/v2/https', ...)` — inline HttpsError
2. `jest.mock('firebase-admin', ...)` — firestoreFn with FieldValue
3. `jest.mock('uuid', ...)` — deterministic ID
4. `jest.mock('../../../core/user', ...)` — prevents getFirestore() at import time
5. `const { HttpsError } = require('firebase-functions/v2/https');`
6. `const createXxx = require('../createXxx').createXxx;`
7. `const admin = require('firebase-admin');`
8. `const { helperFn } = require('../../../core/user');`

All `jest.mock()` calls are hoisted by Jest before any `require()`, so order within
the mock declarations does not matter — but listing them before the requires makes
intent explicit and avoids confusion.

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
