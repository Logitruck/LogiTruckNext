# Payments & Stripe Connect Feature Archetype

## Archetype Name

payments-stripe-connect-feature

---

# Purpose

This archetype governs all features related to:

- Stripe Connect onboarding
- carrier payouts
- payment intents
- escrow-like operational flows
- transaction tracking
- webhook processing
- funding orchestration
- invoice/payment visibility
- payout status monitoring
- operational payment lifecycle management

This is considered a CRITICAL-RISK archetype due to financial, compliance, legal, and operational implications.

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

# Core Business Principle

LogiTruck acts as a logistics orchestration platform.

The platform may:
- coordinate payment flows
- orchestrate transaction lifecycle visibility
- facilitate payout workflows
- expose payment status

The platform must avoid:
- making unsupported legal assumptions
- bypassing Stripe compliance requirements
- simulating regulated financial behavior without review

Human/legal review is mandatory for production payment flows.

---

# Architectural Rules

## Stripe-first architecture

Do not build custom payment infrastructure.

Preferred:
- Stripe Connect
- PaymentIntents
- Webhooks
- Stripe onboarding flows

Avoid:
- custom payout engines
- manual settlement logic
- storing sensitive payment data

---

## Event-driven payments

Payment state must evolve through explicit events.

Examples:

- onboarding_started
- onboarding_completed
- payment_intent_created
- service_started
- service_completed
- shipper_approved
- payout_requested
- payout_sent
- payout_failed

Avoid hidden payment state transitions.

---

## Secure-by-default

Never:
- expose secret keys
- log sensitive payloads
- hardcode credentials
- bypass webhook verification

---

# Risk Classification

| Area | Risk |
|---|---|
| UI payment states | MEDIUM |
| Webhook parsing | HIGH |
| Stripe API orchestration | HIGH |
| Production payouts | CRITICAL |
| Compliance assumptions | CRITICAL |
| Account onboarding | CRITICAL |
| Financial reconciliation | CRITICAL |

---

# Factory Allowed Scope

Factory MAY:

- generate onboarding screens
- generate payload builders
- generate webhook parsers
- generate Firestore persistence helpers
- generate payment state reducers
- generate TypeScript types
- generate mock payment tests
- generate Cloud Function drafts

Factory MAY NOT:

- use production keys
- execute live payouts
- deploy production payment flows
- modify Stripe production settings
- assume compliance approval
- bypass financial review

---

# Claude Code Escalation Rules

Claude Code required for:

- Stripe Connect setup
- production webhook validation
- environment configuration
- secret management
- payout orchestration review
- Firebase deploy review
- financial reconciliation logic
- production payment debugging

---

# Human Approval Required

Human/legal approval required for:

- payout rules
- onboarding requirements
- compliance assumptions
- investor/payment language
- transaction fee models
- financial liability assumptions
- production deployment approval

---

# Preferred Backend Patterns

## Cloud Functions

Preferred:

- callable functions for mobile flows
- onRequest webhooks for Stripe events
- event-driven updates
- isolated payment services

---

## Firestore

Preferred collections:

```txt
payments/
payment_events/
vendor_payouts/
stripe_accounts/
transactions/
```

Avoid:
- duplicating payment truth across collections unnecessarily

---

# Webhook Rules

All Stripe webhooks must:

- verify signatures
- log sanitized payloads only
- support retries
- be idempotent
- isolate failures safely

---

# Frontend Rules

Frontend may:

- show payment state
- show onboarding progress
- display payout history
- display transaction summaries

Frontend must NOT:

- contain secret keys
- make direct privileged Stripe calls
- perform compliance assumptions

---

# Testing Rules

Factory may test:

- payload builders
- reducers
- webhook parsing
- UI state transitions
- onboarding flow state
- Firestore persistence helpers

Factory must NOT test:

- real payouts
- production Stripe APIs
- live onboarding
- real transactions

Use mocked Stripe clients.

---

# Validation Commands

```bash
./node_modules/.bin/jest src/**/__tests__ --watchAll=false --forceExit
./node_modules/.bin/tsc --noEmit
```

---

# Acceptance Criteria Expectations

Every payments feature should define:

- transaction lifecycle
- failure behavior
- retry behavior
- onboarding states
- webhook behavior
- payout visibility
- audit traceability

---

---

## Default Building Blocks

These building blocks are always loaded for every payments-stripe-connect-feature plan:

| Building Block | Why Required |
|----------------|-------------|
| `callable-function-pattern` | All Stripe operations use onCall v2. Auth check is always first. HttpsError for all error paths. |
| `callable-auth-pattern` | Mandatory because stripeconnect.js has an active v1 auth vulnerability (data.auth is undefined in v2). Factory always uses request.auth?.uid. |
| `cloud-function-structure` | Stripe function files follow the same import block and index.js export pattern as all Cloud Functions. |
| `idempotent-event-processing` | Stripe account creation, payment intents, and payout operations must be idempotent. Re-running the same operation cannot create duplicate Stripe resources. |
| `testing-guide` | Tests mock Stripe client. Never use production Stripe keys. Factory tests payload builders, reducers, and webhook parsing shape only. |

## Optional Building Blocks

Include when the feature plan declares the matching need:

| Building Block | When to Include |
|----------------|----------------|
| `stripe-payment-intent-lifecycle` | Feature involves Express account onboarding, payment links, or the webhook handler for account.updated. |
| `event-driven-orchestration` | Feature uses Firestore triggers to propagate payment state changes across collections. |
| `firestore-trigger-pattern` | Feature requires Firestore triggers to react to payment_events or stripe_accounts document changes. |
| `notification-trigger-pattern` | Feature sends push notifications on payment state changes (payout sent, payout failed). |

## Execution Defaults

| Property | Value |
|----------|-------|
| `executionLevelDefault` | `L2` — Claude Code integration required |
| `riskLevelDefault` | `critical` |
| `factoryCanAutoRetry` | `true` for payload builders and UI screens only |
| `requiresClaudeCodeReview` | mandatory — auth pattern, idempotency keys, webhook signature |
| `validationCommands` | `jest`, `tsc --noEmit` (mock Stripe client only) |

## Escalation Rules

| Condition | Escalation |
|-----------|-----------|
| Factory generates UI payment state screens | L1 — factory can generate in sandbox |
| Factory generates payload builders and reducers | L1 — factory can generate in sandbox |
| All Stripe function integration into production | L2 — Claude Code required |
| Webhook handler registration in Stripe dashboard | L2 — Claude Code must configure |
| Production payout logic | L3 — legal/human approval |
| Compliance assumptions or onboarding requirements | L3 — human approval |
| Transaction fee models or financial liability | L3 — human approval |
| Factory cannot use production Stripe keys | L4 — prohibited |
| Factory cannot execute live payouts | L4 — prohibited |

---

# Future Extensions

Potential future archetype expansions:

- investor-funding-feature
- factoring-feature
- escrow-orchestration-feature
- payout-optimization-feature
- financial-reporting-feature
