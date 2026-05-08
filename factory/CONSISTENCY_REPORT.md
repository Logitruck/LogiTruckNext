# LogiTruck Factory Architecture Consistency Report

**Generated:** 2026-05-07  
**Scope:** factory/ system + graphify-out/GRAPH_REPORT.md  
**Method:** Static analysis of all registry, schema, template, building block, and orchestration files. No code modified except this report file.

---

## 1. End-to-End Flow

```
USER REQUEST
  │
  ▼
CLAUDE CODE (architect/orchestrator/integrator)
  Reads:  factory/questions/feature-intake.md
          factory/questions/feature-deep-dive.md
          factory/questions/feature-confirmation.md
  Checks: graphify-out/ for god nodes and community structure
          factory/registry/archetype-registry.json for archetype fit
  │
  ▼
IMPLEMENTATION PLAN (factory/plans/*.plan.json)
  Shape:       factory/templates/implementation-plan-template.json  ← source of truth
  Validated:   factory/schemas/implementation-plan.schema.json
  Informs:     featureArchetype → archetype-registry.json → defaultBuildingBlocks
               selectedBuildingBlocks (explicit overrides)
               dataModelsTouched ← data-model-registry.json
               projectAreasTouched ← project-structure-registry.json
  │
  ▼
n8n FACTORY ORCHESTRATOR
  Step 1: Read archetype-registry.json → load defaultBuildingBlocks
  Step 2: Merge plan.selectedBuildingBlocks → resolvedBuildingBlocks (dedupe)
  Step 3: Load factory/building-blocks/{name}.md for each resolved block
  Step 4: Inject static context: project-structure-registry.json + data-model-registry.json
          (documented in BUILDING_BLOCK_RESOLUTION.md §Step 4 — NOT YET IN n8n WORKFLOW)
  Step 5: Execute plan.taskGraph or plan.factoryExecutionPlan.steps
          → invoke Claude Haiku per task with plan + context bundle
          → Haiku generates files into sandbox
  Step 6: Run validationStrategy.sandboxCommands (jest, tsc)
          → on failure: reload relevant building block, retry (max: factoryExecutionPlan.maxRetries)
  Step 7: Produce handoff package (files + test output + risk notes + integration steps)
  │
  ▼
CLAUDE CODE REVIEW + INTEGRATION
  Follows:  plan.claudeCodeIntegrationPlan.steps
  Runs:     runtimeValidation (Firebase emulator, Firestore reads)
  Optionally: simulatorValidation (iOS/Android)
  Checks:   finalCommitChecklist
  Governance: execution-registry.md defines L0–L4 escalation rules
  │
  ▼
COMMIT TO PRODUCTION REPO
  Claude Code owns git commit — factory never touches production branch directly
```

---

## 2. Source of Truth Map

| Concern | Authoritative File | Notes |
|---|---|---|
| **Plan shape** | `factory/templates/implementation-plan-template.json` | Declared source of truth by user (2026-05-07) |
| **Plan validation** | `factory/schemas/implementation-plan.schema.json` | Regenerated 2026-05-07; enforces enums + additionalProperties:false |
| **Archetype defaults** | `factory/registry/archetype-registry.json` | Maps each archetype → defaultBuildingBlocks, optionalBuildingBlocks, escalationRules |
| **Building block resolution algorithm** | `factory/registry/BUILDING_BLOCK_RESOLUTION.md` | Process doc; archetype-registry is the data |
| **Firestore collection paths** | `factory/registry/data-model-registry.json` | 13+ collections documented from real code |
| **Project paths and imports** | `factory/registry/project-structure-registry.json` | File locations, depth formula, import boundaries, barrel inventory |
| **Execution ownership + escalation** | `factory/registry/execution-registry.md` | Defines L0–L4; factory limits; Claude Code integration checklist |
| **Code graph memory** | `graphify-out/` (GRAPH_REPORT.md + wiki/) | AST-derived knowledge graph; must be kept fresh with `graphify update .` |
| **Overall mission + principles** | `factory/CLAUDE.md` | Platform scope, risk levels, Claude vs factory responsibilities |
| **Architecture narrative** | `factory/ARCHITECTURE.md` | **EMPTY — no content** (see Required Fixes) |

---

## 3. Conflicts and Duplicate Responsibilities

### CONFLICT-1 — 7 Building Blocks Reference Legacy Repo (LogiFunctionsV2)
**Severity: HIGH**

The following building blocks cite file paths from the legacy `LogiFunctionsV2/` repository that does not exist in this workspace:

| Building Block | Legacy Paths Referenced |
|---|---|
| `callable-function-pattern.md` | `LogiFunctionsV2/functions/distributeRequest/acceptVendorOffer.js`, `submitVendorOffer.js`, etc. |
| `cloud-function-structure.md` | `LogiFunctionsV2/functions/distributeRequest/distributeRequest.js`, `stripe/stripeconnect.js`, etc. |
| `callable-auth-pattern.md` | `distributeRequest/acceptVendorOffer.js` (relative — ambiguous) |
| `AI-session-orchestration.md` | `LogiFunctionsV2/functions/` paths |
| `cloud-task-orchestration.md` | `LogiFunctionsV2/functions/` paths |
| `event-driven-orchestration.md` | `LogiFunctionsV2/functions/` paths |
| `firestore-trigger-pattern.md` | `LogiFunctionsV2/functions/` paths |
| `trip-status-machine.md` | `LogiFunctionsV2/functions/` paths |

**Impact:** When Haiku receives these building blocks as context, it may follow patterns from non-existent files, infer wrong import paths, or generate code against the legacy structure instead of the current `functions/app/` layout. The factory's entire correctness guarantee rests on building blocks reflecting real current code — this breaks that guarantee for 7 of 25 blocks.

**Current `functions/` structure (real):**
```
functions/app/chat/chatv2.js
functions/app/carrier/createCarrier.js  (to be generated)
functions/app/jobs/assignCarrierProjectJob.js
functions/app/vendorUser/createVendorUser.js
functions/triggers/distributeRequest/distributeRequest.js
functions/triggers/deels/onRequestUpdated.js
```

---

### CONFLICT-2 — execution-registry.md Protected Paths Don't Exist
**Severity: MEDIUM**

`execution-registry.md` line 191-193 declares:
```
functions/src/payments/
functions/src/auth/
functions/src/orchestration/
```

The actual directory structure has no `functions/src/`. Active functions live in `functions/app/`, `functions/triggers/`, `functions/core/`, and `functions/landing/`. These protected paths are phantom references — the real protected paths are unregistered.

---

### CONFLICT-3 — factory/ARCHITECTURE.md is Empty
**Severity: MEDIUM**

The file exists (1 line) but contains no content. `factory/CLAUDE.md` partially covers principles and mission but has no architectural flow, no component diagram, and no file responsibility map. There is no single document that explains how CLAUDE.md + execution-registry.md + archetype-registry.json + BUILDING_BLOCK_RESOLUTION.md + schemas + templates all compose. This report currently serves that role but shouldn't have to.

---

### CONFLICT-4 — Registry Injection Not Implemented in n8n Workflow
**Severity: MEDIUM**

`BUILDING_BLOCK_RESOLUTION.md §Step 4` now states:

> "The factory also loads the following registry files as static context for all executions:
> - factory/registry/project-structure-registry.json
> - factory/registry/data-model-registry.json"

This is documented intent, but the actual `factory/orchestration/logitruck-factory-workflow.json` and `logitruck-factory-workflow-importable.json` have not been updated to include nodes that read and inject these two files. The documentation and the workflow are out of sync.

---

### CONFLICT-5 — execution-registry.md L0 Definition Contradicts Itself
**Severity: LOW**

L0 is labelled "Factory Autonomous" but the section ends with: "Still requires Claude Code integration into production repo." This means nothing is truly autonomous at any level — every level requires Claude Code for the final repo commit. The L0 label overstates factory independence. The correct distinction is: **L0 = no Claude Code review needed; L1 = Claude Code review before integration; L2+ = Claude Code must actively integrate/validate/approve.**

---

### CONFLICT-6 — chat-channel-orchestration is an Orphan Block
**Severity: LOW**

`factory/building-blocks/chat-channel-orchestration.md` exists as a physical file but is not listed in any archetype's `defaultBuildingBlocks` or `optionalBuildingBlocks` in archetype-registry.json. It is unreachable by the automatic resolution system. Plans can still manually select it via `selectedBuildingBlocks` but it will never be auto-loaded.

---

## 4. Naming Inconsistencies

| Inconsistency | Location A | Location B | Impact |
|---|---|---|---|
| `claudeCodeHandoff` → `claudeCodeIntegrationPlan` | Old schema (removed) | New schema + template | Plans written before 2026-05-07 will fail validation |
| `factoryCanCreate` / `factoryCanModify` → `factoryCanGenerate` / `factoryCanValidate` | execution-registry.md (conceptual) | New schema | No hard break but conceptual drift |
| `factory/knowledge/building-blocks/` (wrong path) | template `selectedBuildingBlocks[].path` | Actual path: `factory/building-blocks/` | Template has wrong base path string — misleads plan authors |
| `executionLevelDefault` (archetype-registry.json) | archetype-registry.json | execution-registry.md never references this field name | Cross-file concept without a bridge |
| "handoff package" (BUILDING_BLOCK_RESOLUTION.md) vs "handoff artifacts" (execution-registry.md) | BUILDING_BLOCK_RESOLUTION.md | execution-registry.md | Same concept, two names |

---

## 5. Schema ↔ Template Alignment

**Result: 8 violations.** Schema is correct. Template requires changes.

Validated with AJV (draft-07). All failures are enum/additionalProperties violations:

| # | Field | Template Value | Required Fix |
|---|---|---|---|
| 1 | `featureArchetype` | `""` | Use a real enum value, e.g. `"utility-feature"` |
| 2 | `businessIntent.operationalCriticality` | `"low \| medium \| high \| critical"` | Replace with `"medium"` |
| 3 | `selectedBuildingBlocks[0].path` | `"factory/knowledge/building-blocks/"` | **Remove field** — `path` is obsolete and incorrect |
| 4 | `selectedBuildingBlocks[0].name` | `""` | Use a real block name, e.g. `"testing-guide"` |
| 5 | `architectureImpact.riskLevel` | `"low \| medium \| high \| critical"` | Replace with `"low"` |
| 6 | `files.create[0].risk` | `"low \| medium \| high \| critical"` | Replace with `"low"` |
| 7 | `files.modify[0].risk` | `"low \| medium \| high \| critical"` | Replace with `"low"` |
| 8 | `testingStrategy.testType` | `"pure-unit \| hook \| ..."` | Replace with `"pure-unit"` |

Note on item 3: the path `factory/knowledge/building-blocks/` is also factually wrong — the real path is `factory/building-blocks/`. Since `path` is being removed from the schema (it's derivable from `name`), this wrong value disappears with the field.

---

## 6. n8n Load Context Bundle Support

### What works today:
- `archetype-registry.json` correctly maps each archetype → defaultBuildingBlocks + optionalBuildingBlocks
- `BUILDING_BLOCK_RESOLUTION.md` documents the merge algorithm (dedupe of defaults ∪ selected)
- All 24 referenced building block names resolve to physical `.md` files in `factory/building-blocks/`
- The schema's `selectedBuildingBlocks[].name` and `resolvedBuildingBlocks[]` enums are closed and match exactly the 25 physical files
- The schema supports `taskGraph` for granular per-file context routing (Haiku receives only the blocks it needs for each task)

### What is missing for full n8n support:

| Gap | Description |
|---|---|
| Static registry injection | n8n workflow doesn't load `project-structure-registry.json` + `data-model-registry.json` as context — documented in BUILDING_BLOCK_RESOLUTION.md but not implemented in the workflow JSON |
| No context size budget | Building block files have no token size metadata. For large archetypes (ai-support-agent: 6 default blocks), the full context bundle may exceed Haiku's optimal window before the plan is even added |
| taskGraph not wired | The schema supports `taskGraph` for per-task block routing but the n8n workflow doesn't read this field yet — it likely processes the whole bundle for every file generation task |
| No MISSING_BLOCK signal | BUILDING_BLOCK_RESOLUTION.md §Fallback says factory logs `MISSING_BLOCK` warning — but with a closed enum in the schema, this can't happen at runtime; the validation catches it at plan time. The fallback section is now dead code. |

---

## 7. What Needs to Change Before Generating the Next Real Feature

### Blockers (factory output will be unreliable without these)

**B1 — Update 7 building blocks to reference current `functions/` paths**  
`callable-function-pattern.md`, `cloud-function-structure.md`, `callable-auth-pattern.md`, `AI-session-orchestration.md`, `cloud-task-orchestration.md`, `event-driven-orchestration.md`, `firestore-trigger-pattern.md`, `trip-status-machine.md`  
Each needs its real examples table updated from `LogiFunctionsV2/functions/…` to current `functions/app/…` and `functions/triggers/…` paths.

**B2 — Apply 8 template fixes**  
Replace pipe-delimited placeholder strings with real enum values; remove the obsolete `path` field from `selectedBuildingBlocks`. The template will then pass schema validation.

**B3 — Fix execution-registry.md protected paths**  
Replace `functions/src/payments/`, `functions/src/auth/`, `functions/src/orchestration/` with the actual paths: `functions/app/stripe/` (if it exists), `functions/app/` (for auth-sensitive callables), `functions/triggers/` (for orchestration triggers).

### Important (system understanding degrades without these)

**I1 — Write factory/ARCHITECTURE.md**  
The file is empty. It should contain: the component map (Claude Code → n8n → Haiku → Claude Code), file responsibility table (who owns what), the execution level decision tree, and the factory/production boundary rule. This report can seed it.

**I2 — Update n8n workflow to inject registry files**  
Add two Read-File nodes before the Haiku generation node: one for `project-structure-registry.json`, one for `data-model-registry.json`. Inject their contents alongside the building block context bundle. This is the gap between the documented intent in BUILDING_BLOCK_RESOLUTION.md and actual n8n behavior.

**I3 — Run `graphify update .`**  
The graph is built from commit `886ce652`. Current HEAD is at least 2 commits ahead. Factory building blocks, registry files, and the createCarrier plan are all unindexed. Architecture questions about "how does X relate to Y" will return stale answers.

### Minor (address when convenient)

**M1 — Register `chat-channel-orchestration` or mark it as orphaned**  
Either add it to a relevant archetype's `optionalBuildingBlocks` (e.g., `ai-support-agent-feature`) or add a note in BUILDING_BLOCK_RESOLUTION.md marking it as manually-selected-only.

**M2 — Clarify L0 definition in execution-registry.md**  
Reword to: "L0 = factory generates and validates without Claude Code review. Claude Code performs only the final production commit (no review step)." This makes the escalation gradient clear.

**M3 — `vendors` collection is in data-model-registry.json but missing from firestore-data-model-access.md**  
The building block (`firestore-data-model-access.md`) documents query patterns for `users`, `vendor_users`, `vendor_vehicles`, etc., but doesn't cover the `vendors` collection. The `createCarrier` plan touches `vendors` and Haiku won't have the schema. Add a `vendors` section to the building block.

---

## Summary

### OK ✓

- archetype-registry.json — all 10 archetypes defined, escalation rules present, no unknown building block references
- All 24 referenced building blocks resolve to physical files
- schema ↔ archetype-registry building block names are consistent (closed enum in schema matches physical inventory)
- data-model-registry.json covers all major collections including `vendors` (line 386)
- project-structure-registry.json accurately reflects the real repo (no invented paths)
- execution-registry.md governance model (L0–L4) is consistent with archetype-registry.json escalation rules
- BUILDING_BLOCK_RESOLUTION.md resolution algorithm is correct and matches archetype-registry.json data structure
- `claudeCodeHandoff` fully removed from schema — `claudeCodeIntegrationPlan` is the canonical field
- `factoryCanCreate` / `factoryCanModify` removed — `factoryCanGenerate` / `factoryCanValidate` are the canonical fields
- `project-structure-imports` and `firestore-data-model-access` correctly integrated into all 8+ archetypes
- `createCarrier.plan.json` is a valid plan (passes schema manually; pending template fix for full AJV pass)
- Factory governance: factory never touches production repo — correctly enforced in CLAUDE.md + execution-registry.md

### Warnings ⚠

- **7 building blocks reference LogiFunctionsV2** — Haiku context will contain wrong file paths (CONFLICT-1)
- **n8n workflow doesn't inject registry files** — documented in BUILDING_BLOCK_RESOLUTION.md but not implemented (CONFLICT-4)
- **graphify is stale** — all factory files added today are invisible to graph queries
- **chat-channel-orchestration orphan** — unreachable by automatic resolution (CONFLICT-6)
- **`vendors` section missing from firestore-data-model-access.md** — any feature that writes to `vendors` (e.g. createCarrier) won't have Firestore guidance in its context bundle

### Required Fixes 🔴

1. Update 7 building blocks: replace `LogiFunctionsV2/` paths with current `functions/app/` and `functions/triggers/` equivalents
2. Apply 8 template changes: replace pipe-delimited enum hints with real values; remove `selectedBuildingBlocks[].path`
3. Fix execution-registry.md protected paths: `functions/src/*` → `functions/app/`, `functions/triggers/`
4. Write `factory/ARCHITECTURE.md` (currently empty)
5. Update n8n workflow to load `project-structure-registry.json` + `data-model-registry.json` as static context nodes

### Recommended Future Improvements 🔵

1. Add `vendors` collection section to `firestore-data-model-access.md`
2. Reword L0 in execution-registry.md to clarify it still requires a production commit (just no review)
3. Add `chat-channel-orchestration` to `ai-support-agent-feature` optionalBuildingBlocks or mark it as manually-selected-only
4. Add token-budget metadata to building blocks to allow n8n to optimize context window usage per task
5. Add schema validation as an explicit n8n node (validate plan JSON before execution begins)
6. Run `graphify update .` as a post-factory-session habit to keep the code graph current
7. Add `executionLevel` as an explicit enum field in the plan schema (currently plans express level via `architectureImpact` flags but there's no direct L0/L1/L2 field)
