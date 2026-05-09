# Mobile Screen Feature Archetype

## Archetype Name

mobile-screen-feature

---

# Purpose

This archetype governs all React Native screen-level features across the LogiTruck mobile ecosystem.

This includes:

- operational screens
- dashboard screens
- setup flows
- job management screens
- request/deals screens
- tracking screens
- AI assistant screens
- onboarding flows
- forms and workflow screens
- realtime operational views

This archetype is considered MEDIUM to HIGH risk depending on navigation impact, realtime dependencies, and operational criticality.

---

# Strategic Role

Mobile screens are the operational interface layer of LogiTruck.

They support:

- dispatch workflows
- driver workflows
- carrier operations
- finder operations
- realtime visibility
- AI-assisted workflows
- operational setup flows
- logistics execution

Screens should prioritize operational clarity, predictable state, and workflow continuity.

---

# Approved Stack

Preferred:

- React Native
- TypeScript
- React Navigation
- Firebase Web SDK
- isolated hooks
- modular UI sections
- dynamicStyles/theme architecture

Avoid:

- oversized screens
- business logic directly inside UI
- duplicated operational state
- hidden navigation side effects

---

# Risk Classification

| Area | Risk |
|---|---|
| Simple isolated screen | MEDIUM |
| Realtime operational screen | HIGH |
| Tracking screen | HIGH |
| Navigation root changes | CRITICAL |
| Auth/session flows | CRITICAL |
| Native module dependencies | CRITICAL |

---

# Core Principles

## Hook-driven architecture

Preferred:

```txt
screen -> hooks -> services -> persistence
```

Avoid:
- Firestore queries directly in screens
- giant useEffect blocks
- mixed business logic/UI logic

---

## Operational-first UX

Operational screens should prioritize:

- fast readability
- status visibility
- workflow continuity
- low-friction interaction
- predictable actions

Avoid:
- excessive animation
- unclear state transitions
- hidden operational actions

---

## Reusable UI sections

Prefer:
- isolated cards
- reusable sections
- status components
- modular operational widgets

Avoid:
- monolithic screens
- duplicated operational UI

---

# Factory Allowed Scope

Factory MAY:

- generate screens
- generate UI sections
- generate hooks
- generate navigation-safe isolated screens
- generate TypeScript types
- generate loading/error states
- generate operational cards
- generate isolated reducers
- generate unit tests

Factory MAY NOT:

- modify navigation roots blindly
- install native modules
- modify Expo plugins
- change auth/session orchestration
- modify protected operational flows

---

# Claude Code Escalation Rules

Claude Code required for:

- navigation root changes
- deep linking changes
- auth/session flows
- native integrations
- map integrations
- realtime orchestration debugging
- Expo plugin modifications
- simulator/device debugging

---

# Human Approval Required

Human approval required for:

- operational workflow redesign
- customer-facing operational messaging
- safety-critical UI decisions
- production operational rollout

---

# Recommended Structure

Preferred:

```txt
src/<role>/screens/
src/components/
src/hooks/
src/services/
src/modules/
```

---

# Screen Structure Rules

Preferred screen composition:

```txt
Screen
├── hooks
├── sections
├── cards
├── actions
└── bottom sheets/modals
```

Avoid:
- giant JSX blocks
- inline business logic
- duplicated reducers

---

# State Management Rules

Preferred:
- local isolated state
- hook-based orchestration
- reducer-driven complex state

Avoid:
- oversized global state
- duplicated operational state
- hidden side effects

---

# Navigation Rules

Screens should:

- explicitly define params
- support back navigation
- preserve operational continuity
- isolate navigation side effects

Avoid:
- hidden navigation mutations
- implicit route assumptions

Protected navigation areas require Claude Code review.

---

# Loading/Error Rules

Every operational screen should define:

- loading state
- empty state
- error state
- retry behavior
- offline behavior when applicable

Avoid blank states.

---

# Realtime Screen Rules

Realtime screens should:

- isolate listeners
- cleanup subscriptions
- throttle updates when necessary
- avoid rerender storms

Avoid:
- duplicate listeners
- hidden subscriptions
- unbounded realtime updates

---

# AI Screen Rules

AI-enabled screens should:

- isolate AI orchestration
- support fallback behavior
- support escalation
- preserve transcript/session continuity

Avoid:
- giant AI orchestration directly inside UI

---

# Testing Rules

Factory may test:

- rendering logic
- loading states
- empty states
- reducers
- callback behavior
- navigation params
- hook integration

Factory must NOT test:

- native runtime behavior
- simulator/device GPS behavior
- production auth
- native build flows
- unrelated repository tests
- existing historical failing suites

Use mocks/adapters.

## Generated Test Scope

For mobile screen generation, tests must be generated and executed only for the files produced by the current factory run.

Rules:
- Do not run all Jest tests.
- Do not run `functions/` tests.
- Do not run unrelated hook tests.
- Implementation exports and generated test imports must match exactly.
- Style tests may only import style helpers that the generated `styles.ts` actually exports.
- If the feature plan specifies `testFirst: false` or `testType: build-only`, prefer TypeScript validation only.

---

# Validation Commands

For `mobile-screen-feature`, factory validation must be scoped to generated files only.

Do NOT run the full Jest suite.

Use TypeScript validation for project compatibility:

```bash
./node_modules/.bin/tsc --noEmit
```

If tests were generated, run only the generated test files:

```bash
./node_modules/.bin/jest <generated-test-file-1> <generated-test-file-2> --watchAll=false --forceExit
```

Never run unrelated tests from:
- `functions/`
- `src/core/`
- other role hooks
- existing historical test suites

Factory validates the generated files and generated tests. Claude Code validates the full repository after integrating the handoff into the real repo.

---

# Acceptance Criteria Expectations

Every mobile screen feature should define:

- target role
- workflow purpose
- navigation entrypoints
- loading/error behavior
- realtime requirements
- persistence dependencies
- operational actions
- escalation/fallback behavior

---

# Future Extensions

Potential future archetype expansions:

- tracking-screen-feature
- setup-wizard-feature
- AI-chat-screen-feature
- dispatch-dashboard-feature
- operational-review-feature
- realtime-monitoring-screen-feature
