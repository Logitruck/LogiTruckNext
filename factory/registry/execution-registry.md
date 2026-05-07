
# Factory Execution Registry

## Purpose

Define execution ownership, escalation boundaries, and automation limits across the LogiTruck AI software factory.

This registry determines:

- what the factory may generate
- what the factory may validate
- what Claude Code must integrate
- what requires human approval
- what is prohibited

---

# Core Governance Rule

Factory execution never directly modifies the real production repository.

The factory works only in:

- temporary clones
- isolated branches
- sandbox workspaces
- staging repositories

Factory output is always considered an integration candidate only.

Claude Code owns:

- production repository integration
- runtime validation
- simulator/device validation
- architecture validation
- final commit
- production-safe review

---

# Execution Levels

| Level | Description |
|---|---|
| L0 | Factory autonomous |
| L1 | Factory + Claude review |
| L2 | Claude Code integration required |
| L3 | Human approval required |
| L4 | Prohibited |

---

# L0 — Factory Autonomous

Factory may autonomously generate and validate:

- pure utilities
- TypeScript types
- isolated helpers
- formatting functions
- low-risk hooks
- loading states
- empty states
- mock services
- test scaffolding
- isolated reducers
- deterministic calculations

Validation allowed:

- jest
- tsc
- eslint
- isolated test runs

Still requires Claude Code integration into production repo.

---

# L1 — Factory + Claude Review

Factory may generate in sandbox, but Claude review is required before integration:

- React Native screens
- Firestore hooks
- realtime listeners
- Cloud Functions
- operational UI
- AI session UI
- route rendering
- BottomSheets
- operational reducers
- notification orchestration
- event propagation logic

Factory may:

- retry
- self-correct
- patch
- rerun tests

Claude Code validates:

- architecture consistency
- scaling concerns
- realtime lifecycle
- cleanup correctness
- repo alignment

---

# L2 — Claude Code Integration Required

Factory may prepare handoff artifacts only.

Claude Code must integrate, validate, and test:

- Firebase schema changes
- Cloud Task orchestration
- AI orchestration
- Stripe integration
- GHL integration
- auth/session changes
- navigation root changes
- tracking orchestration
- production event pipelines
- realtime operational flows

Claude Code responsibilities:

- runtime validation
- simulator validation
- architecture validation
- dependency installation
- rollback validation

---

# L3 — Human Approval Required

Human approval required before integration/deployment:

- production payment changes
- payout logic
- legal/compliance flows
- privacy-sensitive AI behavior
- customer-facing AI claims
- operational SLA changes
- investor-facing financial logic
- destructive migrations
- permission-sensitive native behavior

Human approval may occur:

- before Claude integration
- before deployment
- before production enablement

---

# L4 — Prohibited

Factory must never autonomously:

- deploy to production
- rotate secrets
- modify production infrastructure
- execute destructive migrations
- bypass auth/security
- disable validations
- commit directly to production repo
- expose secrets
- modify protected operational flows blindly

---

# Protected Areas

Protected areas require Claude Code review at minimum:

```txt
ios/
android/
app.json
eas.json
firebase.json
firestore.rules
storage.rules
functions/src/payments/
functions/src/auth/
functions/src/orchestration/
```

---

# Validation Registry

## Factory Validation

Allowed:

- jest
- tsc
- eslint
- isolated runtime mocks
- snapshot validation
- deterministic flow validation

Not allowed:

- production runtime validation
- device validation
- production payment execution
- production Firestore writes
- production AI orchestration

---

# Retry Rules

Factory retry allowed for:

- TypeScript errors
- lint errors
- missing imports
- failing isolated tests
- formatting issues
- deterministic runtime errors

Escalate to Claude Code when:

- retry count exceeded
- native runtime involved
- architecture conflict detected
- production risk increases
- event propagation uncertain
- realtime lifecycle unstable

---

# Handoff Package Requirements

Every factory execution must produce:

- generated files
- modified files
- validation output
- failing tests if unresolved
- retry summary
- risk notes
- Claude integration notes

---

# Claude Code Integration Checklist

Claude Code must validate:

- repo consistency
- architecture alignment
- lifecycle correctness
- cleanup correctness
- navigation correctness
- realtime stability
- dependency safety
- simulator/runtime behavior when applicable

Before final merge.

---

# Future Evolution

This registry may later support:

- automatic risk scoring
- dynamic execution routing
- confidence-based retries
- architecture linting
- self-healing generation
- autonomous patch validation
