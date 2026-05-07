# Utility Feature Archetype

## Archetype Name

utility-feature

---

# Purpose

This archetype governs low-risk deterministic utility work across the LogiTruck ecosystem.

This includes:

- pure TypeScript utilities
- formatting helpers
- conversion helpers
- validators
- small data transformers
- simple type helpers
- constants
- small reusable calculations
- test helpers
- i18n-safe helper functions

This archetype is classified as LOW risk when it is isolated, pure, and does not touch production integrations.

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
- validating runtime behavior when applicable
- validating architecture compatibility
- committing final production-safe changes

---

# Strategic Role

Utility features are ideal for factory automation because they are deterministic, easy to test, isolated, low-cost to generate, low-cost to validate, and useful across mobile, backend, landings, and AI services.

They are the best starting point for validating factory quality and retry behavior.

---

# Risk Classification

| Area | Risk |
|---|---|
| Pure utility | LOW |
| Formatting helper | LOW |
| Conversion helper | LOW |
| Type helper | LOW |
| Validation helper | LOW |
| Utility used in payments | MEDIUM/HIGH |
| Utility used in auth/security | HIGH |
| Utility used in native runtime | HIGH |

---

# Factory Allowed Scope

Factory MAY generate, in sandbox only:

- pure utility files
- utility tests
- TypeScript types
- test fixtures
- simple constants
- helper functions
- small validation helpers
- simple formatting helpers
- documentation comments when useful

Factory MAY NOT:

- modify production repo directly
- introduce new dependencies without approval
- touch auth/security behavior without escalation
- touch payment calculations without escalation
- touch native behavior without escalation
- modify large protected files

---

# Claude Code Responsibilities

Claude Code owns:

- final integration into the real repo
- review of naming and placement
- review of shared utility impact
- final test validation in the real repo
- commit of production-safe changes

For low-risk utilities, Claude Code review can be lightweight.

---

# Human Approval Required

Human approval required for utilities that affect:

- pricing
- payouts
- fees
- compliance
- safety decisions
- customer-facing claims
- operational responsibility assumptions

---

# Preferred File Locations

Use existing project conventions:

```txt
src/utils/
src/services/<domain>/utils/
src/modules/<module>/utils/
functions/utils/
apps/web/<landing>/src/utils/
shared/utils/
```

Avoid creating new utility folders unless the plan explains why.

---

# Utility Design Rules

Utilities should be:

- pure when possible
- deterministic
- typed
- small
- easy to test
- dependency-light
- named clearly

Avoid:

- hidden side effects
- Firestore calls
- network calls
- native calls
- global state mutations
- time-dependent behavior without injectable clock

---

# TypeScript Rules

Use:

- explicit input types
- explicit return types for exported utilities
- narrow types
- readonly inputs where useful

Avoid:

- `any`
- broad object mutation
- implicit unsafe casts
- mixed units without clear naming

---

# Unit Conversion Rules

For distance/time/money utilities:

- define internal unit clearly
- avoid mixing meters, miles, and kilometers silently
- document rounding behavior
- test edge cases

Examples:

```txt
metersToMiles
milesToKm
formatEtaMinutes
formatDistanceMiles
```

---

# Money Utility Rules

Money utilities are NOT automatically low risk.

Escalate if utility affects:

- Stripe
- fees
- commissions
- payouts
- taxes
- investor returns
- carrier payments

Use integer cents for money where applicable.

---

# Testing Rules

For pure utilities:

- do NOT use renderHook
- do NOT use React Testing Library
- import function directly
- test input/output behavior
- test edge cases
- test invalid inputs

Example:

```ts
import { milesToKm } from '../milesToKm';

describe('milesToKm', () => {
  it('converts miles to kilometers', () => {
    expect(milesToKm(1)).toBe(1.61);
  });
});
```

---

# Validation Commands

```bash
./node_modules/.bin/jest src/**/__tests__ --watchAll=false --forceExit
./node_modules/.bin/tsc --noEmit
```

For targeted factory runs, prefer testing only the generated utility folder when possible.

---

# Retry Rules

Factory retry is allowed for:

- failing utility assertions
- TypeScript errors
- missing imports
- wrong file paths
- rounding mismatch
- invalid edge case handling

Escalate when:

- utility impacts payments
- utility impacts auth/security
- utility impacts native runtime
- utility requires new dependencies
- utility touches protected files

---

# Acceptance Criteria Expectations

Every utility feature should define:

- function name
- input shape
- output shape
- edge cases
- error behavior
- rounding behavior if numeric
- file location
- test expectations

---

# Future Extensions

Potential future archetype expansions:

- financial-utility-feature
- geo-utility-feature
- i18n-utility-feature
- validation-helper-feature
- AI-prompt-utility-feature
