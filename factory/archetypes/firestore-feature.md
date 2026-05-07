# Firestore Feature Archetype

## Archetype Name

firestore-feature

---

# Purpose

This archetype governs all Firestore-related features across the LogiTruck ecosystem.

This includes:

- Firestore hooks
- realtime listeners
- collection queries
- document synchronization
- role-based data access
- operational state persistence
- chat persistence
- tracking persistence
- AI session persistence
- operational dashboards

This archetype is considered MEDIUM to HIGH risk depending on data sensitivity and realtime impact.

---
# Production Integration Rule

Factory execution never directly modifies the real production repository.

The factory works only in:
- temporary clones
- isolated branches
- sandbox workspaces
- staging repositories

Factory output is considered an integration candidate only.

Claude Code is always responsible for:
- reviewing generated changes
- integrating into the real repository
- validating runtime behavior
- validating architecture compatibility
- validating simulator/device behavior when applicable
- committing final production-safe changes

# Strategic Role

Firestore is the operational realtime data layer of LogiTruck.

It supports:

- dispatch workflows
- tracking synchronization
- messaging systems
- AI session state
- operational dashboards
- project/job coordination
- workflow orchestration
- realtime collaboration

Firestore should remain structured, predictable, and scalable.

---

# Approved Stack

Preferred:

- Firebase Web SDK
- modular Firestore SDK
- TypeScript
- isolated hooks
- event-driven persistence
- realtime subscriptions with cleanup

Avoid:

- oversized documents
- unbounded listeners
- duplicated operational truth
- deeply nested uncontrolled structures

---

# Risk Classification

| Area | Risk |
|---|---|
| Simple query hook | LOW |
| Realtime listener | MEDIUM |
| Multi-role synchronization | HIGH |
| Cross-collection orchestration | HIGH |
| Security rules assumptions | CRITICAL |
| Production migrations | CRITICAL |

---

# Core Principles

## Realtime-first

Firestore features should prioritize:

- realtime consistency
- predictable subscriptions
- efficient updates
- cleanup handling
- offline resilience

Avoid unnecessary polling.

---

## Single source of truth

Operational data should avoid duplication.

Preferred:
- references
- normalized operational state
- derived UI state

Avoid:
- duplicated business state across collections
- conflicting operational ownership

---

## Role-aware access

Features should explicitly define:

- finder access
- carrier access
- dispatcher access
- driver access
- support/admin access

Avoid implicit permission assumptions.

---

# Factory Allowed Scope

Factory MAY:

- generate Firestore hooks
- generate query adapters
- generate listener cleanup
- generate collection services
- generate realtime reducers
- generate TypeScript types
- generate mock Firestore tests
- generate Firestore utility helpers

Factory MAY NOT:

- deploy security rules
- perform production migrations
- modify indexes blindly
- assume security access
- bypass auth validation

---

# Claude Code Escalation Rules

Claude Code required for:

- security rules review
- complex query optimization
- index debugging
- emulator debugging
- recursive listener debugging
- migration planning
- production data integrity review

---

# Human Approval Required

Human approval required for:

- destructive migrations
- operational schema redesign
- compliance-sensitive persistence
- customer-visible data exposure

---

# Recommended Structure

Preferred:

```txt
src/hooks/
src/services/firestore/
src/modules/<module>/hooks/
src/modules/<module>/services/
```

---

# Hook Rules

Firestore hooks should:

- isolate query logic
- unsubscribe properly
- expose loading/error state
- support realtime updates
- support role-aware filtering

Preferred pattern:

```txt
hook -> firestore service -> UI
```

Avoid:
- Firestore logic directly inside screens
- duplicate listeners
- hidden side effects

---

# Listener Rules

Realtime listeners must:

- unsubscribe on cleanup
- avoid duplicate subscriptions
- avoid broad collection scans
- support empty states
- support loading state

Always verify cleanup in tests.

---

# Collection Design Rules

Preferred:
- normalized collections
- operational references
- lightweight documents
- explicit relationships

Avoid:
- oversized arrays
- giant documents
- duplicated nested structures
- storing large binary data

---

# Query Rules

Queries should:

- remain index-friendly
- minimize collection scans
- use pagination where appropriate
- isolate role filters

Avoid:
- client-side filtering of huge collections
- unbounded realtime subscriptions

---

# AI Session Persistence Rules

AI-related persistence should:

- separate transcript state
- separate workflow state
- support resumability
- support auditability

Avoid:
- giant transcript documents
- uncontrolled growth

---

# Testing Rules

Factory may test:

- query builders
- reducers
- Firestore adapters
- listener cleanup
- state transitions
- payload normalization
- persistence helpers

Factory must NOT test:

- production Firestore
- production rules
- live customer data
- destructive migrations

Use mocked Firestore adapters/emulators.

---

# Validation Commands

```bash
./node_modules/.bin/jest --watchAll=false --forceExit
./node_modules/.bin/tsc --noEmit
```

---

# Acceptance Criteria Expectations

Every Firestore feature should define:

- collections involved
- subscription lifecycle
- cleanup behavior
- role-based access
- loading/error states
- offline expectations
- synchronization expectations
- persistence ownership

---

---

## Default Building Blocks

These building blocks are always loaded for every firestore-feature plan:

| Building Block | Why Required |
|----------------|-------------|
| `hook-service-pattern` | Defines the three-layer hook → client → Firestore architecture. All new hooks must follow this pattern and expose { data, loading, error }. |
| `realtime-firestore-listener` | Core read primitive. Defines onSnapshot lifecycle, cleanup contract, null-as-loading sentinel, and dependency array discipline. |
| `loading-empty-error-state` | Every hook must return loading state and every consuming screen must handle null/[]/error. |
| `testing-guide` | Firestore hook tests use mockOnSnapshot + waitFor + act(unmount) cleanup verification. |

## Optional Building Blocks

Include when the feature plan declares the matching need:

| Building Block | When to Include |
|----------------|----------------|
| `async-lookup-then-subscribe` | Hook requires a preliminary Firestore read (vendorID, dispatchID) before it can subscribe. Mandatory ref+cancelled pattern. |
| `idempotent-event-processing` | Hook drives a mutation (write/update/delete) that could be called multiple times for the same event. |

## Execution Defaults

| Property | Value |
|----------|-------|
| `executionLevelDefault` | `L1` — factory + Claude Code review |
| `riskLevelDefault` | `medium` |
| `factoryCanAutoRetry` | `true` (TypeScript, mock setup failures) |
| `requiresClaudeCodeReview` | yes — lifecycle correctness, cleanup, dep array |
| `validationCommands` | `jest`, `tsc --noEmit` |

## Escalation Rules

| Condition | Escalation |
|-----------|-----------|
| Hook requires async vendorID lookup before subscribe | L1 — include `async-lookup-then-subscribe` |
| Hook touches multiple collections in one effect | L2 — Claude Code lifecycle review |
| Hook requires Firestore index creation | L2 — Claude Code must create index |
| Hook involves security rules assumptions | L2 — Claude Code security review |
| Hook performs destructive data operations | L3 — human approval |
| Factory cannot deploy Firestore security rules | L4 — prohibited |

---

# Future Extensions

Potential future archetype expansions:

- realtime-chat-feature
- AI-session-persistence-feature
- dispatch-dashboard-feature
- tracking-persistence-feature
- operational-feed-feature
- realtime-collaboration-feature
