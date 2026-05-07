# Feature Intake Questions

## Purpose

Capture the minimum business and technical context required before creating a LogiTruck implementation plan.

The goal is to classify the feature, identify risk, select building blocks, and avoid unsafe automation.

---

# Core Questions

Ask only what is missing. Do not ask every question if the user already provided enough context.

## 1. Business Goal

What problem does this feature solve?

Clarify:
- who benefits
- what workflow improves
- what outcome is expected

---

## 2. Target Area

Which part of LogiTruck is affected?

Options:
- mobile app
- driver app
- carrier app
- finder flow
- Firebase Functions
- Firestore
- AI assistant
- voice agent
- landing page
- payments
- n8n workflow
- multiple projects

---

## 3. User Role

Which role is affected?

Options:
- driver
- carrier
- dispatcher
- finder
- shipper
- investor
- admin/support
- public lead
- internal operator

---

## 4. Feature Type

Classify the feature as one primary archetype.

---

## 5. Operational Criticality

Is this feature operationally critical?

Examples:
- tracking
- dispatch
- payments
- live AI support
- customer onboarding

---

## 6. Existing Pattern

Is there an existing screen, hook, function, or flow this should follow?

Claude should inspect the repo if unclear.

---

## 7. Protected Areas

Is there anything that must not be modified?

Examples:
- auth/session flow
- payments
- native folders
- tracking runtime
- production orchestration

---

## 8. Validation Expectation

What should prove this feature works?

Examples:
- tests pass
- screen renders
- route recalculates
- Firestore writes succeed
- AI session persists
- Stripe flow succeeds

---

# Output Requirement

After intake, Claude Architect must produce:

- feature summary
- archetypes
- selected building blocks
- risk level
- automation scope
- Claude integration scope
- open questions

Do not generate implementation code during intake.
