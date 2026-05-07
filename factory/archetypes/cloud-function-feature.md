# Cloud Function Feature Archetype

## Archetype Name

cloud-function-feature

---

# Purpose

This archetype governs all Firebase Cloud Functions features across the LogiTruck ecosystem.

This includes:

- callable functions
- HTTP endpoints
- webhooks
- Firestore triggers
- scheduled jobs
- background orchestration
- AI orchestration services
- event-driven workflows
- automation handlers
- notification systems

This archetype is considered MEDIUM to HIGH risk depending on operational impact.

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

Cloud Functions are the orchestration backbone of LogiTruck.

They coordinate:

- operational events
- AI workflows
- payment orchestration
- CRM integrations
- realtime updates
- notifications
- support escalations
- tracking synchronization
- lead automation

Functions should remain modular, observable, and event-driven.

---

# Approved Stack

Preferred:

- Firebase Functions v2
- Node.js 20
- ESM modules
- Firestore
- Cloud Tasks
- TypeScript
- isolated service architecture

Avoid:

- monolithic functions
- oversized callable handlers
- business logic inside controllers
- duplicated orchestration logic

---

# Risk Classification

| Area | Risk |
|---|---|
| Simple callable function | MEDIUM |
| Firestore trigger | MEDIUM |
| Notification orchestration | HIGH |
| AI orchestration | HIGH |
| Payment webhooks | CRITICAL |
| Production migrations | CRITICAL |
| Recursive event chains | CRITICAL |

---

# Core Principles

## Event-driven architecture

Preferred flow:

```txt
Event -> Function -> Service -> Persistence -> Notification
```

Avoid:
- tightly coupled workflows
- direct chained mutations
- hidden side effects

---

## Idempotency

Functions must safely handle retries.

Required for:
- webhooks
- Firestore triggers
- background jobs
- payment flows

---

## Observability

Functions should log:

- execution start
- execution end
- failure reason
- relevant IDs
- retry attempts

Avoid logging sensitive data.

---

# Factory Allowed Scope

Factory MAY:

- generate callable functions
- generate Firestore triggers
- generate service files
- generate payload validation
- generate TypeScript types
- generate helper services
- generate mock orchestration flows
- generate unit tests
- generate retry-safe helpers

Factory MAY NOT:

- deploy functions
- modify production secrets
- configure billing
- perform production migrations
- bypass auth/security rules
- modify production indexes blindly

---

# Claude Code Escalation Rules

Claude Code required for:

- production deploy
- Firebase emulator debugging
- recursive trigger debugging
- secret configuration
- event-loop analysis
- Cloud Tasks orchestration review
- payment orchestration review
- production migration review

---

# Human Approval Required

Human approval required for:

- destructive migrations
- billing-sensitive operations
- customer-impacting automation
- compliance-sensitive flows
- production payment flows

---

# Recommended Structure

Preferred:

```txt
functions/
├── src/
│   ├── callable/
│   ├── triggers/
│   ├── webhooks/
│   ├── services/
│   ├── ai/
│   ├── payments/
│   ├── notifications/
│   ├── utils/
│   └── types/
```

---

# Firestore Trigger Rules

Triggers must:

- guard against recursion
- compare before/after state
- avoid duplicate writes
- use narrow execution scope
- validate operational state transitions

Avoid:
- blind writes
- cascading loops
- broad collection scans

---

# Callable Function Rules

Callable functions should:

- validate auth
- validate payload shape
- isolate business logic
- return deterministic responses
- avoid oversized handlers

Preferred:

```txt
callable -> service -> persistence
```

---

# Webhook Rules

Webhooks must:

- verify signatures when applicable
- sanitize logs
- support retries
- remain idempotent
- isolate failures safely

---

# AI Orchestration Rules

AI orchestration functions should:

- isolate prompts
- isolate providers
- support retries
- support observability
- support escalation

Avoid:
- giant orchestration files
- hidden prompt mutations
- provider lock-in inside controllers

---

# Testing Rules

Factory may test:

- payload validation
- service logic
- reducer/state helpers
- orchestration helpers
- retry logic
- idempotency logic
- Firestore adapter behavior

Factory must NOT test:

- live production Firebase
- production secrets
- production payment flows
- production AI APIs

Use mocks/emulators.

---

# Validation Commands

```bash
npm run lint
./node_modules/.bin/jest --watchAll=false --forceExit
./node_modules/.bin/tsc --noEmit
```

---

# Acceptance Criteria Expectations

Every Cloud Function feature should define:

- trigger source
- auth expectations
- retry behavior
- failure handling
- persistence behavior
- observability expectations
- escalation behavior
- idempotency expectations

---

# Future Extensions

Potential future archetype expansions:

- webhook-orchestration-feature
- AI-orchestrator-feature
- notification-engine-feature
- cloud-task-feature
- CRM-sync-feature
- realtime-sync-feature
