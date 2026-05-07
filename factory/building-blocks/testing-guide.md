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
