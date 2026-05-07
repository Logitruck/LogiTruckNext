# Building Block Resolution

## Purpose

This document explains how the LogiTruck AI Software Factory resolves building blocks for each feature, how context bundles are generated, and how Claude Code, Claude Haiku, and the factory orchestrator interact during execution.

---

## The Resolution Flow

```
featureArchetype (declared in implementation plan)
    ↓
archetype-registry.json → defaultBuildingBlocks
    ↓
implementation plan → selectedBuildingBlocks (override/extend)
    ↓
merge + dedupe → resolvedBuildingBlocks
    ↓
context bundle generation (load .md files)
    ↓
factory execution (Haiku prompt injection)
    ↓
validation (jest + tsc)
    ↓
Claude Code review + integration
```

---

## Step 1: Archetype Lookup

When a feature plan declares `featureArchetype: "mobile-screen-feature"`, the factory reads `factory/registry/archetype-registry.json` and loads:

```json
{
  "defaultBuildingBlocks": [
    "screen-hook-separation",
    "hook-service-pattern",
    "loading-empty-error-state",
    "testing-guide"
  ],
  "optionalBuildingBlocks": [
    "realtime-firestore-listener",
    "async-lookup-then-subscribe",
    "route-rendering-pattern"
  ],
  "executionLevelDefault": "L1",
  "riskLevelDefault": "medium"
}
```

---

## Step 2: Plan Override via selectedBuildingBlocks

The implementation plan may declare `selectedBuildingBlocks` to extend or restrict the defaults:

```json
"selectedBuildingBlocks": [
  {
    "name": "realtime-firestore-listener",
    "required": true,
    "reason": "Screen shows live driver location updates"
  },
  {
    "name": "async-lookup-then-subscribe",
    "required": true,
    "reason": "Dispatch hooks require vendorID lookup before subscribe"
  }
]
```

Only building blocks that exist physically in `factory/building-blocks/` may be referenced.

---

## Step 3: Merge and Deduplicate

```
resolvedBuildingBlocks = dedupe(defaultBuildingBlocks ∪ selectedBuildingBlocks)
```

Rules:
- `defaultBuildingBlocks` are always included unless explicitly excluded in the plan
- `selectedBuildingBlocks` adds to the defaults
- Duplicates are removed (same name appears once)
- `required: false` entries from `selectedBuildingBlocks` are included only if they appear in `optionalBuildingBlocks` for the archetype
- Building blocks NOT in the registry's `optionalBuildingBlocks` for the archetype require a `required: true` override with a `reason`

**Merge algorithm (pseudocode):**

```
function resolve(archetype, plan):
  defaults = registry[archetype].defaultBuildingBlocks
  selected = plan.selectedBuildingBlocks ?? []
  
  selectedNames = selected.map(s => s.name)
  merged = [...defaults]
  
  for each s in selected:
    if s.name not in merged:
      merged.push(s.name)
  
  return dedupe(merged)
```

---

## Step 4: Context Bundle Generation

For each building block name in `resolvedBuildingBlocks`, the factory loads:

```
factory/building-blocks/<name>.md
```

The factory also loads the following registry files as static context for all executions:

```
factory/registry/project-structure-registry.json   — file locations, import depths, role boundaries
factory/registry/data-model-registry.json          — Firestore collection paths, ownership, field names
```

These registry files are always injected alongside the resolved building block bundle. They are not building blocks themselves and are not listed in `defaultBuildingBlocks` — they are static reference data that supplements the context bundle.

All loaded documents are concatenated into a context bundle that is injected into the Haiku prompt.

**Example resolved bundle for `mobile-screen-feature` + realtime:**

```
CONTEXT BUNDLE:
--- screen-hook-separation.md ---
[content]

--- hook-service-pattern.md ---
[content]

--- loading-empty-error-state.md ---
[content]

--- realtime-firestore-listener.md ---
[content]

--- testing-guide.md ---
[content]
```

---

## Fallback Behavior

### Missing building block file

If a building block name is referenced but the `.md` file does not exist in `factory/building-blocks/`, the factory:

1. Logs a `MISSING_BLOCK` warning in the execution report
2. Skips that block (does not fail hard)
3. Notes the gap in the handoff package for Claude Code review

**Factory must never invent building block content.** Only verified physical files are loaded.

### Empty selectedBuildingBlocks

If the plan declares no `selectedBuildingBlocks`, the factory uses only `defaultBuildingBlocks` from the registry. This is the minimal valid context.

### Unknown archetype

If `featureArchetype` does not match any key in `archetype-registry.json`, the factory:

1. Rejects the plan with `UNKNOWN_ARCHETYPE` error
2. Does not attempt execution
3. Returns error to Claude Code for resolution

---

## Escalation Behavior

Each archetype defines `escalationRules` with four tiers:

| Tier | Meaning | Factory Action |
|------|---------|----------------|
| `escalateToL1` | Factory generates, Claude Code reviews | Add to review checklist |
| `escalateToL2` | Claude Code must integrate, not just review | Block auto-merge, require Claude Code step |
| `escalateToL3` | Human approval required | Block integration until approval confirmed |
| `escalateToL4` | Prohibited for factory | Reject plan item, return to Claude Code |

The factory evaluates escalation rules against the plan's `architectureImpact` fields and `files` lists. Any match triggers the corresponding escalation tier.

---

## How Claude Code Interacts

Claude Code is the **architect and integrator**, not the generator.

Claude Code responsibilities:
1. Creates or reviews the implementation plan JSON
2. Confirms `featureArchetype` and `selectedBuildingBlocks`
3. Verifies `resolvedBuildingBlocks` before factory execution
4. Reviews factory output (generated files in `/tmp` clone)
5. Validates architecture alignment against this codebase
6. Checks lifecycle correctness (cleanup, subscriptions, auth)
7. Integrates passing output into the production repository
8. Commits production-safe changes

Claude Code does NOT:
- Generate repetitive utility code (factory handles)
- Re-derive building block context (factory resolves)
- Run the validation loop (factory runs jest + tsc)

---

## How Claude Haiku Interacts

Claude Haiku is the **deterministic generator**.

Haiku receives:
1. The implementation plan (feature name, files to create, acceptance criteria)
2. The resolved context bundle (concatenated building block .md files)
3. A generation prompt scoped to one file or feature unit

Haiku generates:
- TypeScript/JS source files
- Test files
- Type definitions
- Utility functions
- Hook implementations
- Cloud Function handlers

Haiku does NOT:
- Make architecture decisions
- Override building block patterns
- Choose which patterns to follow (context bundle is pre-resolved)
- Integrate into the production repository

The context bundle ensures Haiku always generates code that matches the real codebase patterns. Without the bundle, Haiku would produce generic React Native code instead of LogiTruck-specific patterns.

---

## How the Factory Orchestrator Interacts

The factory orchestrator (n8n) manages the pipeline:

1. **Receives** implementation plan from Claude Code (via webhook or file)
2. **Reads** archetype-registry.json to resolve building blocks
3. **Loads** context bundle from `factory/building-blocks/`
4. **Invokes** Haiku with plan + context bundle
5. **Runs** validation (jest + tsc) against generated output
6. **Retries** on validation failure (up to `maxRetries` from plan)
7. **Produces** handoff package (files + validation output + risk notes)
8. **Notifies** Claude Code that output is ready for review

The orchestrator is stateless between steps. The implementation plan is the single source of truth for each execution.

---

## Building Block Physical Inventory

The following building blocks exist in `factory/building-blocks/` as of 2026-05-07:

| File | Domain | Primary Archetypes |
|------|--------|--------------------|
| `AI-session-orchestration.md` | AI persistence | ai-support-agent, voice-agent-elevenlabs |
| `AI-workflow-pipeline.md` | AI patterns | ai-support-agent, voice-agent-elevenlabs |
| `assistant-session-persistence.md` | AI + Firestore | ai-support-agent, voice-agent-elevenlabs |
| `async-lookup-then-subscribe.md` | Firestore hooks | firestore, mobile-screen, maps-tracking |
| `callable-auth-pattern.md` | Cloud Functions | cloud-function, payments |
| `callable-function-pattern.md` | Cloud Functions | cloud-function, payments, ai-support-agent |
| `chat-channel-orchestration.md` | Chat system | cloud-function, ai-support-agent |
| `cloud-function-structure.md` | Cloud Functions | cloud-function, payments, ai-support-agent |
| `cloud-task-orchestration.md` | Async fan-out | cloud-function |
| `event-driven-orchestration.md` | Firestore triggers | cloud-function, payments |
| `firestore-trigger-orchestration.md` | Trigger topology | cloud-function |
| `firestore-trigger-pattern.md` | Triggers | cloud-function, firestore |
| `hook-service-pattern.md` | React hooks | mobile-screen, firestore, maps-tracking, ai-support-agent |
| `idempotent-event-processing.md` | Safety | cloud-function, payments, firestore |
| `loading-empty-error-state.md` | UI patterns | mobile-screen, firestore, maps-tracking, landing |
| `notification-trigger-pattern.md` | Push notifications | cloud-function |
| `realtime-firestore-listener.md` | Firestore | mobile-screen, firestore, maps-tracking |
| `route-rendering-pattern.md` | Navigation | mobile-screen, maps-tracking, native-integration |
| `screen-hook-separation.md` | Architecture | mobile-screen, maps-tracking |
| `stripe-payment-intent-lifecycle.md` | Stripe | payments |
| `testing-guide.md` | Testing | ALL archetypes |
| `trip-status-machine.md` | Domain logic | maps-tracking, cloud-function |
| `voice-session-lifecycle.md` | Voice/Audio | voice-agent-elevenlabs, native-integration |
| `firestore-data-model-access.md` | Firestore schema | firestore, mobile-screen, cloud-function, maps-tracking, ai-support-agent, voice-agent-elevenlabs, payments, landing |
| `project-structure-imports.md` | File structure + imports | mobile-screen, firestore, cloud-function, maps-tracking, ai-support-agent, voice-agent-elevenlabs, landing (default); utility, native-integration, payments (optional) |

**Total: 25 building blocks verified as physical files.**

---

## Architectural Gaps Detected

The following patterns are referenced in archetypes or building blocks but do NOT yet have a physical building block file. These are candidates for future creation:

| Missing Block | Referenced In | Priority |
|---------------|--------------|----------|
| `role-aware-data-access.md` | hook-service-pattern.md | MEDIUM — vendorID/activeVendorID resolution per role (partially covered by firestore-data-model-access) |
| `model-toFirestore-pattern.md` | hook-service-pattern.md | MEDIUM — ES6 class + toFirestore() validation |
| `offline-sync-pattern.md` | hook-service-pattern.md | MEDIUM — AsyncStorage + write queue |
| `mutation-optimistic-update.md` | hook-service-pattern.md | LOW — optimistic UI during pending writes |
| `stripe-webhook-handler.md` | stripe-payment-intent-lifecycle.md | CRITICAL — chargesEnabled never updates without this |
| `ghl-crm-integration.md` | landing-react-vite-feature.md | MEDIUM — CRM webhook payload builders |

---

## Validation Commands for Resolution Verification

```bash
# Verify all building blocks referenced in registry exist on disk
node -e "
const registry = require('./factory/registry/archetype-registry.json');
const fs = require('fs');
const allBlocks = new Set();
Object.values(registry.archetypes).forEach(a => {
  [...a.defaultBuildingBlocks, ...a.optionalBuildingBlocks].forEach(b => allBlocks.add(b));
});
const missing = [];
allBlocks.forEach(b => {
  const path = 'factory/building-blocks/' + b + '.md';
  if (!fs.existsSync(path)) missing.push(path);
});
if (missing.length > 0) {
  console.error('MISSING BLOCKS:', missing);
  process.exit(1);
} else {
  console.log('All', allBlocks.size, 'building blocks verified on disk');
}
"
```

---

## Future Evolution

This resolution system is designed to support:

1. **Automatic context loading** — n8n reads the registry and loads context without Claude Code specifying blocks manually
2. **Confidence-based block selection** — plan metadata (touchesFirebase, touchesNavigation) triggers automatic optional block inclusion
3. **Haiku token budget optimization** — load only the blocks Haiku needs, not the full archetype default set
4. **Architecture linting** — verify generated files match the patterns in the loaded context bundle
5. **Self-healing generation** — on validation failure, the factory reloads a corrective block (e.g., `async-lookup-then-subscribe`) and regenerates
