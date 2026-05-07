# Feature Confirmation Checklist

## Purpose

Final confirmation before sending a feature to the LogiTruck factory pipeline.

This step validates:
- scope
- risk
- ownership
- automation boundaries
- validation expectations

---

# Confirmation Checklist

## 1. Feature Scope Confirmed

Confirm:
- business objective
- affected roles
- expected outcome
- operational impact

---

## 2. Archetypes Confirmed

Confirm:
- primary archetype
- secondary archetypes
- building blocks selected

---

## 3. Protected Areas Reviewed

Confirm no unsafe automation affects:
- auth
- payments
- production orchestration
- native runtime
- critical tracking flows

---

## 4. Factory Scope Confirmed

Confirm factory is allowed to:
- generate
- validate
- retry
- produce handoff package

Factory must NOT:
- modify production repo directly
- deploy
- bypass Claude review

---

## 5. Claude Code Responsibilities Confirmed

Claude Code owns:
- integration into real repo
- runtime validation
- simulator/device validation
- dependency installation
- final commit

---

## 6. Human Approval Confirmed

Determine if approval required for:
- payments
- compliance
- AI claims
- operational SLAs
- destructive migrations
- permission-sensitive native changes

---

## 7. Validation Expectations Confirmed

Confirm:
- test strategy
- runtime validation
- simulator expectations
- rollback expectations
- success criteria

---

# Final Output

Before execution, Claude Architect must confirm:

- implementation plan generated
- risks documented
- building blocks selected
- validation strategy defined
- escalation path defined
- rollback strategy defined
- handoff expectations defined

Only after confirmation may the feature proceed to factory execution.
