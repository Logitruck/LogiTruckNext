# Feature: [FEATURE NAME]

**Created:** YYYY-MM-DD  
**Last updated:** YYYY-MM-DD | Session: SXX  
**Owner:** [name]  
**Status:** [ ] In Progress / [ ] Blocked / [ ] Complete

---

## Overview

[One paragraph: what this feature does, who it serves, why it was built]

---

## Design Decisions

[Key architectural decisions made during discovery. Update as decisions are made.]

- Decision 1: [what and why]
- Decision 2: [what and why]

---

## Discovery Answers

[Paste answers from feature-intake.md questions here. This is the contract for the feature.]

- Business goal:
- Target area:
- User role:
- Existing patterns to reuse:
- Protected areas:
- Validation expectation:

---

## Phase Status

| Phase | Description | Status | Blocker |
|---|---|---|---|
| 1 — Cloud Functions | Backend callable functions | ⏳ / ✅ / ❌ | — |
| 2 — Data Hooks | Firestore / Functions hooks | ⏳ / ✅ / ❌ | — |
| 3 — Screens | UI screens and components | ⏳ / ✅ / ❌ | — |
| 4 — Navigation | Navigator integration | ⏳ / ✅ / ❌ | Claude Code direct |
| 5 — Integration | End-to-end validation | ⏳ / ✅ / ❌ | — |

---

## Pieces

| Piece | Plan | Factory Status | Integrated | Notes |
|---|---|---|---|---|
| piece-name | ✅ / ⏳ / ❌ | passed / failed / pending | ✅ / ⏳ | — |

**Factory Status legend:** `pending` → `running` → `passed` → `integrated` / `failed` → `blocked`

---

## Dependencies

### npm / Native Libraries

| Library | Required by | Type | Gate Status |
|---|---|---|---|
| library-name | piece-name | JS-only / Native | ⏳ pending / ✅ approved / ✅ validated on sim |

### Archetype / Building Block Gaps

| Gap | Type | Status |
|---|---|---|
| archetype-name | missing archetype | ⏳ to create / ✅ created |
| building-block-name | missing building block | ⏳ to create / ✅ created |

---

## Approvals Pending

| Item | Requires | Status |
|---|---|---|
| [dependency X install] | Simulator validation | ⏳ / ✅ |
| [native permission Y] | Human approval | ⏳ / ✅ |

---

## Session Log

| Session | Date | What was done | What's next |
|---|---|---|---|
| S01 | YYYY-MM-DD | Discovery + design master | Create plans Phase 1 |
| S02 | YYYY-MM-DD | Factory run pieces 1-3 | Integrate outputs |
