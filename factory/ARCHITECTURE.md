# LogiTruck AI Software Factory — Architecture

## Purpose

This document is the structural map of the LogiTruck AI Software Factory. It defines which actor owns which responsibility, which file is the source of truth for each concern, and how a feature request flows from an implementation plan to production-ready code.

---

## End-to-End Flow

```
1. Claude Code (architect)
   ├── Reads codebase, identifies feature scope
   ├── Creates implementation plan JSON (factory/plans/*.plan.json)
   ├── Selects featureArchetype + selectedBuildingBlocks
   └── Triggers factory execution (n8n webhook)

2. n8n (orchestrator)
   ├── Reads archetype-registry.json → resolves defaultBuildingBlocks
   ├── Merges with plan's selectedBuildingBlocks → resolvedBuildingBlocks
   ├── Loads each resolved block from factory/building-blocks/<name>.md
   ├── Loads project-structure-registry.json + data-model-registry.json (static context)
   ├── Builds context bundle (concatenated .md files + registry JSON)
   └── Invokes Claude Haiku with: plan + context bundle + generation prompt

3. Claude Haiku (generator)
   ├── Generates TypeScript/JS source files per plan's files.create list
   ├── Follows patterns from context bundle exactly
   ├── Writes to /tmp sandbox clone only
   └── Returns generated files + test files

4. Validation loop (n8n managed)
   ├── Runs jest + tsc against generated output
   ├── On failure: reloads corrective building block, retries (up to maxRetries)
   └── On success: packages handoff artifacts

5. Handoff package (n8n → Claude Code)
   ├── Generated source files
   ├── Test files
   ├── Validation output (jest + tsc results)
   ├── Risk notes
   └── claudeCodeIntegrationPlan from the implementation plan

6. Claude Code (integrator)
   ├── Reviews generated files against codebase patterns
   ├── Validates architecture alignment (lifecycle, cleanup, auth, navigation)
   ├── Integrates passing output into production repo
   ├── Runs simulator/device validation
   └── Commits final changes
```

---

## Actor Ownership

| Actor | Owns | Does NOT own |
|-------|------|-------------|
| **Claude Code** | Architecture decisions, implementation plans, codebase integration, production commits, native dependencies, complex orchestration | Repetitive code generation, validation loops, building block resolution |
| **n8n** | Workflow orchestration, building block resolution, context bundle assembly, Haiku invocation, retry logic, handoff packaging | Code quality decisions, architecture choices, production repo access |
| **Claude Haiku** | File generation from plan + context bundle, test scaffolding | Architecture decisions, pattern selection, production integration, index.js registration |
| **Validation (jest + tsc)** | Confirming generated code compiles and unit tests pass | Runtime behavior, device behavior, architectural correctness |

---

## Source of Truth Map

| Concern | Source of truth | Secondary references |
|---------|----------------|---------------------|
| Which archetypes exist and what blocks they use | `factory/registry/archetype-registry.json` | `BUILDING_BLOCK_RESOLUTION.md` |
| Physical building block content | `factory/building-blocks/<name>.md` | — |
| Firestore collection paths, fields, ownership | `factory/registry/data-model-registry.json` | `building-blocks/firestore-data-model-access.md` |
| File locations, import depths, role boundaries | `factory/registry/project-structure-registry.json` | `building-blocks/project-structure-imports.md` |
| Execution levels, escalation rules | `factory/registry/execution-registry.md` | `archetype-registry.json` (per-archetype escalationRules) |
| Implementation plan schema | `factory/schemas/implementation-plan.schema.json` | `factory/templates/implementation-plan-template.json` |
| Factory actor roles and safety model | `factory/CLAUDE.md` | This document |
| Building block resolution algorithm | `factory/registry/BUILDING_BLOCK_RESOLUTION.md` | — |

---

## Context Bundle Resolution

When n8n prepares a Haiku invocation:

```
featureArchetype (from plan)
    ↓
archetype-registry.json → defaultBuildingBlocks
    ↓
plan.selectedBuildingBlocks (adds to or extends defaults)
    ↓
resolvedBuildingBlocks = dedupe(defaults ∪ selected)
    ↓
Load factory/building-blocks/<name>.md for each resolved block
    +
Load factory/registry/project-structure-registry.json   [always]
Load factory/registry/data-model-registry.json           [always]
    ↓
Concatenate → context bundle
    ↓
Inject into Haiku prompt alongside the implementation plan
```

**Rules:**
- `defaultBuildingBlocks` are always included unless explicitly excluded
- `selectedBuildingBlocks` only adds blocks; it does not replace defaults
- Building blocks not in `optionalBuildingBlocks` for the archetype require `"required": true` + `"reason"` in the plan
- A referenced block that has no `.md` file logs `MISSING_BLOCK` and is skipped — the factory never invents block content
- `project-structure-registry.json` and `data-model-registry.json` are injected as static context for every execution (not listed in building blocks)

---

## Execution Levels

| Level | Name | Factory action | Claude Code action |
|-------|------|---------------|--------------------|
| **L0** | Autonomous | Generate + validate, no review needed | Integrates after automated check |
| **L1** | Factory + Review | Generate + validate | Reviews output, approves integration |
| **L2** | Claude Integration Required | Prepares handoff artifacts only | Must actively integrate, validate, test |
| **L3** | Human Approval | Prepares handoff artifacts only | Routes for human approval before merge |
| **L4** | Prohibited | Rejects plan item | Returns error to Claude Code |

Each archetype defines its `executionLevelDefault` and `escalationRules` in `archetype-registry.json`. Plan items may trigger escalation if their `architectureImpact` fields match any escalation rule condition.

---

## Protected Areas

The factory must never write to or modify these paths in the production repo:

```
ios/                     ← Expo-generated, native, never touch directly
android/                 ← Expo-generated, native, never touch directly
app.json                 ← Expo/EAS config, plugin changes require prebuild
eas.json                 ← Build profiles
firebase.json            ← Hosting + emulator config
firestore.rules          ← Security rules, human + Claude review required
storage.rules            ← Security rules, human + Claude review required
functions/index.js       ← Central export registry — Claude Code registers new exports
functions/app/           ← All callable functions — Claude Code integration required
functions/triggers/      ← All Firestore triggers — Claude Code integration required
functions/landing/       ← Investor-facing AI functions — human approval required for customer-facing changes
functions/core/          ← Shared auth/user utilities — Claude Code integration required
```

---

## Handoff and Integration Model

The factory produces an **integration candidate**, never a production commit.

**Handoff package contains:**
- Generated source files (in `/tmp` sandbox, never in the production repo)
- Test output (jest + tsc results)
- Risk notes from plan's `architectureImpact`
- `claudeCodeIntegrationPlan.steps` from the implementation plan

**Claude Code integration checklist (minimum):**
1. Review each generated file against the real codebase patterns
2. Confirm hook lifecycle correctness (cleanup, unsubscribe, useEffect deps)
3. Confirm auth checks are the first statement in all `onCall` functions
4. Confirm `functions/index.js` is updated to export new functions
5. Confirm no hardcoded API keys or collection paths in generated code
6. Run `npm test` against the real test suite
7. Run `tsc` in project root
8. Validate on simulator/device for any screen or navigation changes
9. Commit with semantic commit message

---

## Directory Layout

```
factory/
├── ARCHITECTURE.md              ← this file
├── CLAUDE.md                    ← actor roles and safety model
├── CONSISTENCY_REPORT.md        ← last audit results and blockers
│
├── building-blocks/             ← 25 .md files — Haiku context
│   ├── screen-hook-separation.md
│   ├── hook-service-pattern.md
│   ├── realtime-firestore-listener.md
│   └── ... (22 more)
│
├── registry/
│   ├── archetype-registry.json           ← archetype → building block mapping
│   ├── data-model-registry.json          ← Firestore collection definitions
│   ├── project-structure-registry.json   ← file locations + import rules
│   ├── execution-registry.md             ← L0–L4 governance
│   └── BUILDING_BLOCK_RESOLUTION.md      ← resolution algorithm + inventory
│
├── schemas/
│   └── implementation-plan.schema.json   ← AJV-validated plan schema (source of truth)
│
├── templates/
│   └── implementation-plan-template.json ← blank plan for new features
│
└── plans/
    └── createCarrier.plan.json           ← example feature plan
```

---

## Design Constraints

1. **Factory never modifies the production repo.** All generation happens in `/tmp` clones.
2. **Building blocks are immutable context.** Haiku follows them; it does not make pattern decisions.
3. **Plans are the single source of truth for each execution.** The n8n orchestrator is stateless between steps; the plan contains everything needed.
4. **Claude Code owns integration.** No auto-merge, no CI-driven promotion from factory output.
5. **CommonJS only in `functions/`.** No ES module syntax, no TypeScript. Every new function must be registered in `functions/index.js`.
6. **No TypeScript path aliases.** All imports in `src/` are relative. Depth matters — see `building-blocks/project-structure-imports.md`.
