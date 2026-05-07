# LogiTruck Factory Pipeline

## Purpose

Define the end-to-end operational pipeline for the LogiTruck AI software factory.

This pipeline governs how a feature moves from idea to implementation candidate to Claude Code integration and final production-safe commit.

The factory is not a direct production engineer.

The factory is a controlled sandbox execution system that generates, validates, retries, and packages implementation candidates.

Claude Code owns final integration into the real production repository.

---

# Core Principle

Factory execution never directly modifies the real production repository.

The factory works only in:

- temporary clones
- isolated branches
- sandbox workspaces
- staging repositories

Factory output is always an integration candidate.

Claude Code owns:

- production repo integration
- architecture validation
- runtime validation
- simulator/device validation
- final commit
- production-safe review

---

# Pipeline Overview

```txt
USER / CLAUDE ARCHITECT
        ↓
FEATURE INTAKE
        ↓
DEEP DIVE
        ↓
FEATURE CONFIRMATION
        ↓
IMPLEMENTATION_PLAN.json
        ↓
SANDBOX SETUP
        ↓
FACTORY GENERATION
        ↓
SANDBOX VALIDATION
        ↓
AUTO-CORRECTION LOOP
        ↓
HANDOFF PACKAGE
        ↓
CLAUDE CODE INTEGRATION
        ↓
RUNTIME VALIDATION
        ↓
FINAL COMMIT / MERGE
```

---

# Stage 1 — Feature Intake

## Owner

Claude Architect

## Inputs

- user request
- factory/questions/feature-intake.md
- repo context
- Graphify knowledge graph
- factory/CLAUDE.md

## Outputs

- feature summary
- affected roles
- target project
- primary archetype
- secondary archetypes
- initial risk level
- known protected zones
- open questions

## Exit Criteria

Claude has enough context to classify the feature and proceed to deep dive.

No code is generated in this stage.

---

# Stage 2 — Feature Deep Dive

## Owner

Claude Architect

## Inputs

- feature intake output
- factory/questions/feature-deep-dive.md
- selected archetypes
- relevant building blocks
- real repo references

## Outputs

- selected building blocks
- technical risks
- integration risks
- testing expectations
- required mocks
- runtime validation requirements
- escalation requirements

## Exit Criteria

Claude can define factory scope, Claude Code scope, and human approval scope.

No code is generated in this stage.

---

# Stage 3 — Feature Confirmation

## Owner

Claude Architect + User

## Inputs

- intake summary
- deep dive findings
- factory/questions/feature-confirmation.md

## Outputs

- approved scope
- approved risk level
- approved automation boundary
- approved validation strategy

## Exit Criteria

User or Claude Architect confirms the feature is ready for planning.

---

# Stage 4 — Implementation Plan Generation

## Owner

Claude Architect

## Inputs

- factory/templates/implementation-plan-template.json
- factory/schemas/implementation-plan.schema.json
- selected archetypes
- selected building blocks
- Graphify project context
- real repo references

## Output

```txt
IMPLEMENTATION_PLAN.json
```

## Required Plan Contents

- featureName
- featureArchetype
- secondaryArchetypes
- businessIntent
- selectedBuildingBlocks
- repoContext
- architectureImpact
- automationScope
- files
- testingStrategy
- validationStrategy
- factoryExecutionPlan
- claudeCodeIntegrationPlan
- acceptanceCriteria
- rollbackPlan
- openQuestions

## Exit Criteria

Plan passes schema validation and is ready for factory execution.

---

# Stage 5 — Sandbox Setup

## Owner

n8n Factory

## Inputs

- IMPLEMENTATION_PLAN.json
- Git repository URL
- target branch
- feature name
- GitHub token or repo credentials

## Actions

- create clean temporary workspace
- clone target repo
- create isolated branch or working copy
- install dependencies only in sandbox
- prepare execution folders
- load selected building blocks
- load selected archetypes
- load validation commands

## Output

- sandbox path
- repo path
- branch/workspace name
- prepared context bundle

## Exit Criteria

Sandbox is ready and isolated from production repo.

---

# Stage 6 — Factory Generation

## Owner

n8n Factory Executors

## Inputs

- IMPLEMENTATION_PLAN.json
- selected building blocks
- selected archetypes
- repo snapshot
- reference files

## Actions

Depending on execution level:

### L0

Factory may generate:
- pure utilities
- tests
- simple helpers
- deterministic functions

### L1

Factory may generate:
- hooks
- components
- screens
- Firestore helpers
- Cloud Function drafts
- AI session helpers

### L2

Factory may generate handoff artifacts only:
- implementation candidates
- checklists
- integration notes
- test scaffolding

## Output

- generated files
- modified files in sandbox only
- test files
- generation log

## Exit Criteria

Factory has generated all planned implementation candidates.

---

# Stage 7 — Sandbox Validation

## Owner

n8n Factory

## Inputs

- generated sandbox code
- testingStrategy
- validationStrategy
- selected building blocks

## Actions

Run appropriate commands:

- dependency install
- targeted Jest tests
- TypeScript check
- lint when available
- build checks for landing projects
- schema validation
- static safety checks

## Output

- validation output
- pass/fail status
- failed test summary
- TypeScript errors
- lint errors
- risk notes

## Exit Criteria

Either validation passes or the feature enters auto-correction.

---

# Stage 8 — Auto-Correction Loop

## Owner

n8n Factory

## Inputs

- validation errors
- generated files
- selected building blocks
- implementation plan
- retry rules

## Allowed Corrections

Factory may correct:

- TypeScript errors
- failing isolated tests
- wrong imports
- wrong file paths
- mock setup issues
- simple logic mismatches
- formatting issues

## Not Allowed

Factory must escalate when error involves:

- native build failure
- dependency conflict
- Expo plugin issue
- Pods / Gradle
- auth/session runtime behavior
- production payment behavior
- Firestore security rules
- event propagation uncertainty
- AI production orchestration
- retry limit exceeded

## Retry Limit

Default:

```txt
maxRetries: 2
```

May be reduced for high-risk features.

## Output

- retry summary
- patched files
- new validation output
- unresolved failures if any

## Exit Criteria

Either validation passes or factory creates a handoff package with unresolved issues clearly documented.

---

# Stage 9 — Handoff Package

## Owner

n8n Factory

## Purpose

Package all factory output so Claude Code can review and integrate safely.

## Package Must Include

- IMPLEMENTATION_PLAN.json
- generated files
- modified files
- tests
- validation output
- retry history
- unresolved failures
- risk notes
- selected building blocks
- selected archetypes
- Claude integration steps
- rollback notes

## Output Format

Preferred:

```txt
factory/output/<featureName>/
├── IMPLEMENTATION_PLAN.json
├── generated-files/
├── tests/
├── validation-output.txt
├── retry-summary.md
├── risk-notes.md
├── claude-integration-steps.md
└── rollback-plan.md
```

## Exit Criteria

Claude Code has enough context to integrate without redoing the entire planning process.

---

# Stage 10 — Claude Code Integration

## Owner

Claude Code

## Inputs

- handoff package
- production repo
- Graphify graph
- real repo context
- selected building blocks
- validation output

## Actions

Claude Code:

- reviews generated changes
- compares against architecture rules
- checks building block compliance
- applies changes to production repo manually or via patch
- resolves integration conflicts
- installs dependencies when required
- modifies native configuration when required
- updates related files
- updates tests
- validates repo consistency

## Output

- production repo changes
- integration notes
- runtime validation plan
- commit-ready state

## Exit Criteria

Changes are safely integrated into the real repository.

---

# Stage 11 — Runtime Validation

## Owner

Claude Code

## Required For

- mobile screens
- maps
- tracking
- native integrations
- payments
- AI voice
- Cloud Functions
- navigation
- auth/session flows

## Validation May Include

- simulator run
- device run
- Expo validation
- EAS compatibility check
- Firebase emulator
- local Cloud Functions test
- mocked Stripe webhook
- landing build
- AI session mock
- manual UI verification

## Output

- runtime validation notes
- screenshots/logs when useful
- known limitations
- unresolved risks

## Exit Criteria

Claude Code confirms the feature is production-safe or clearly marks remaining blockers.

---

# Stage 12 — Final Commit / Merge

## Owner

Claude Code + Human Approval When Required

## Before Commit

Verify:

- tests pass
- tsc passes
- runtime validation completed when applicable
- no secrets committed
- protected areas reviewed
- rollback plan defined when applicable
- human approval completed when required

## Commit Message Format

Preferred:

```txt
feat(<area>): <short feature description>
```

Examples:

```txt
feat(driver): add trip status machine
feat(factory): add implementation plan schema
feat(payments): add Stripe Connect onboarding draft
```

## Exit Criteria

Feature is committed safely to the production repository.

---

# Escalation Matrix

| Condition | Escalate To |
|---|---|
| Native dependency required | Claude Code |
| Pods / Gradle / Expo config | Claude Code |
| Stripe production flow | Claude Code + Human |
| Legal/compliance assumption | Human |
| AI customer-facing claims | Human |
| Firestore security rules | Claude Code + Human if production |
| Cloud Tasks orchestration | Claude Code |
| Event chain uncertainty | Claude Code |
| Retry limit exceeded | Claude Code |
| Production deployment | Claude Code + Human |

---

# Factory Success Signals

A factory run is successful when:

- implementation plan is valid
- generated files match plan
- selected tests pass
- TypeScript passes or errors are documented
- retry summary is included
- risk notes are included
- Claude integration package is complete

Factory success does NOT mean production-ready.

Production readiness is owned by Claude Code.

---

# Pipeline Anti-Patterns

Avoid:

- factory writing directly to production repo
- skipping implementation plan
- generating code without building blocks
- running broad retries on high-risk features
- hiding validation failures
- treating sandbox success as production success
- deploying from factory
- allowing factory to handle secrets

---

# Future Evolution

Potential future improvements:

- automatic implementation plan schema validation
- building block compliance scoring
- automatic architecture linting
- confidence-based execution routing
- Claude Code diff review automation
- patch-based handoff
- PR generation
- multi-repo orchestration
- risk-aware retry strategies
