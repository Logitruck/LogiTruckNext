# n8n Workflow Design — LogiTruck Factory

## Purpose

Define the operational n8n workflow that executes LogiTruck Factory implementation plans in a sandbox workspace.

This workflow receives a validated implementation plan, creates a temporary repo clone, generates tests and implementation candidates, validates them, retries safe failures, and packages a handoff for Claude Code.

The workflow never modifies the real production repository directly.

---

# Core Governance Rule

Factory output is an integration candidate only.

Claude Code owns:

- integration into the real production repo
- runtime validation
- architecture validation
- simulator/device validation
- final commit

n8n Factory owns:

- sandbox setup
- deterministic generation
- validation
- safe retries
- handoff packaging

---

# High-Level Workflow

```txt
Webhook Trigger
  ↓
Parse Request
  ↓
Validate Implementation Plan
  ↓
Classify Risk / Execution Level
  ↓
Setup Sandbox
  ↓
Clone Repository
  ↓
Load Context Bundle
  ↓
Generate Tests
  ↓
Write Tests
  ↓
Generate Implementation Candidates
  ↓
Write Implementation Files
  ↓
Run Validation
  ↓
IF Validation Failed
      ↓
      Analyze Failure
      ↓
      Safe Retry / Patch
      ↓
      Re-run Validation
  ↓
Package Handoff
  ↓
Return Response
```

---

# Required Input Shape

The webhook should accept either:

## Option A — Full implementation plan

```json
{
  "project": "LogiTruck",
  "repoUrl": "https://github.com/org/repo.git",
  "baseBranch": "main",
  "implementationPlan": {}
}
```

## Option B — Task only

```json
{
  "project": "LogiTruck",
  "task": "Create utility hook useMilesToKm..."
}
```

If only task is provided, Claude Architect must generate the `IMPLEMENTATION_PLAN.json` before n8n execution.

Recommended production mode: Option A.

---

# Shared Data Contract Between Nodes

Every node should preserve and forward:

```json
{
  "project": "",
  "featureName": "",
  "featureArchetype": "",
  "executionLevel": "",
  "repoUrl": "",
  "baseBranch": "",
  "workDir": "",
  "repoDir": "",
  "plan": {},
  "selectedBuildingBlocks": [],
  "riskLevel": "",
  "testsData": {},
  "implData": {},
  "testsWritten": [],
  "filesWritten": [],
  "validationOutput": "",
  "retryCount": 0,
  "retryHistory": [],
  "status": "",
  "handoffPath": "",
  "errors": []
}
```

---

# Node 1 — Webhook Trigger

## Purpose

Receives the factory execution request.

## Recommended URLs

Test:

```txt
/webhook-test/factory/execute
```

Production:

```txt
/webhook/factory/execute
```

## Output

Raw incoming JSON.

---

# Node 2 — Parse Request

## Purpose

Normalize request into factory data contract.

## Responsibilities

- extract project
- extract repoUrl
- extract baseBranch
- extract implementationPlan
- derive featureName
- derive workDir
- derive repoDir
- initialize retryCount
- initialize status

## Output

```json
{
  "featureName": "use-miles-to-km",
  "workDir": "/tmp/logitruck-use-miles-to-km",
  "repoDir": "/tmp/logitruck-use-miles-to-km/repo",
  "plan": {},
  "status": "parsed"
}
```

---

# Node 3 — Validate Implementation Plan

## Purpose

Ensure the plan matches:

```txt
factory/schemas/implementation-plan.schema.json
```

## Responsibilities

- verify required fields
- verify featureArchetype
- verify files section
- verify testingStrategy
- verify automationScope
- reject unsafe plans

## Failure Behavior

If invalid:

```json
{
  "status": "rejected",
  "reason": "Invalid implementation plan schema"
}
```

Do not continue.

---

# Node 4 — Classify Risk / Execution Level

## Purpose

Map plan risk to execution level using:

```txt
factory/registry/execution-registry.md
```

## Output Examples

```json
{
  "executionLevel": "L0",
  "riskLevel": "low"
}
```

```json
{
  "executionLevel": "L2",
  "riskLevel": "critical",
  "handoffOnly": true
}
```

## Rules

- utility-feature → L0
- mobile-screen-feature → L1
- firestore-feature → L1/L2 depending on schema/rules
- cloud-function-feature → L1/L2
- maps-tracking-feature → L2 if native/runtime involved
- native-integration-feature → L2/L3
- payments-stripe-connect-feature → L2/L3
- voice-agent-elevenlabs-feature → L2/L3

---

# Node 5 — Setup Sandbox

## Purpose

Prepare a clean temporary workspace.

## Command Pattern

```bash
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
mkdir -p "$WORK_DIR/handoff"
mkdir -p "$WORK_DIR/logs"
```

## Output

- workDir created
- handoff folder created
- logs folder created

---

# Node 6 — Clone Repository

## Purpose

Clone repo into sandbox.

## Command Pattern

```bash
git clone --depth 1 --branch "$BASE_BRANCH" "$REPO_URL" "$REPO_DIR"
```

## Notes

If branch does not exist, fail clearly.

Do not fallback silently to main unless plan allows it.

---

# Node 7 — Load Context Bundle

## Purpose

Load selected context needed for generation.

## Inputs

- selectedBuildingBlocks
- selected archetypes
- execution registry
- testing guide
- implementation plan

## Context Bundle Should Include

```txt
factory/CLAUDE.md
factory/registry/execution-registry.md
factory/building-blocks/testing-guide.md
factory/archetypes/<featureArchetype>.md
factory/knowledge/building-blocks/<selected>.md
IMPLEMENTATION_PLAN.json
```

## Output

```json
{
  "contextBundle": "...compressed markdown..."
}
```

---

# Node 8 — Generate Tests

## Purpose

Generate tests first based on implementation plan and building blocks.

## Executor

- L0: Haiku
- L1: Sonnet
- L2: optional/handoff only depending on risk

## Prompt Must Include

- implementation plan
- selected building blocks
- testing guide
- repo context
- file paths
- acceptance criteria

## Output Shape

```json
{
  "tests": [
    {
      "filePath": "src/utils/__tests__/x.test.ts",
      "content": "..."
    }
  ]
}
```

---

# Node 9 — Write Tests

## Purpose

Write generated tests into sandbox repo only.

## Rules

- resolve paths under repoDir
- prevent path traversal
- create directories recursively
- record testsWritten

## Output

```json
{
  "testsWritten": []
}
```

---

# Node 10 — Generate Implementation Candidates

## Purpose

Generate implementation files based on plan and tests.

## Executor

- L0: Haiku
- L1: Sonnet
- L2: handoff artifacts or Sonnet draft only
- L3: no implementation without human approval

## Prompt Must Include

- plan
- tests
- selected building blocks
- relevant reference files
- known anti-patterns to avoid
- output JSON only

## Output Shape

```json
{
  "files": [
    {
      "filePath": "src/utils/x.ts",
      "content": "..."
    }
  ]
}
```

---

# Node 11 — Write Implementation Files

## Purpose

Write generated implementation candidates into sandbox repo only.

## Rules

- never write outside repoDir
- never modify protected files unless plan explicitly allows
- record filesWritten
- preserve output for handoff

---

# Node 12 — Run Validation

## Purpose

Run sandbox validation commands from the plan.

## Recommended Mobile Command

```bash
cd "$REPO_DIR" &&
NODE_ENV=development npm install --include=dev --legacy-peer-deps &&
./node_modules/.bin/jest <target> --watchAll=false --forceExit &&
./node_modules/.bin/tsc --noEmit
```

## Recommended Landing Command

```bash
cd "$REPO_DIR" &&
npm install &&
npm run build
```

## Output

```json
{
  "validationPassed": true,
  "validationOutput": "..."
}
```

---

# Node 13 — IF Validation Failed

## Purpose

Branch workflow.

If validation passed:
- go to Package Handoff

If failed:
- go to Analyze Failure

---

# Node 14 — Analyze Failure

## Purpose

Classify whether failure is safe for retry.

## Safe Retry Failures

- TypeScript errors
- missing imports
- failing isolated tests
- wrong paths
- mock setup errors
- formatting/parsing problems

## Escalate Failures

- native build
- dependency conflict
- Expo plugin
- pod install
- Gradle
- Stripe production
- Firestore security rules
- AI runtime orchestration
- retry limit exceeded

## Output

```json
{
  "retryAllowed": true,
  "failureType": "typescript",
  "rootCause": "",
  "patchInstructions": ""
}
```

---

# Node 15 — Generate Patch

## Purpose

Generate a safe patch only if retryAllowed is true.

## Prompt Must Include

- validationOutput
- generated files
- tests
- plan
- selected building blocks
- failure classification

## Output Shape

```json
{
  "patches": [
    {
      "filePath": "",
      "content": ""
    }
  ],
  "reason": ""
}
```

---

# Node 16 — Apply Patch

## Purpose

Write patch files into sandbox repo only.

## Rules

- increment retryCount
- append retryHistory
- enforce maxRetries
- rerun validation after patch

---

# Node 17 — Package Handoff

## Purpose

Create complete handoff package for Claude Code.

## Handoff Folder

```txt
factory/output/<featureName>/
```

or inside sandbox:

```txt
$WORK_DIR/handoff/
```

## Must Include

```txt
IMPLEMENTATION_PLAN.json
generated-files/
tests/
validation-output.txt
retry-summary.md
risk-notes.md
claude-integration-steps.md
rollback-plan.md
manifest.json
```

## manifest.json

```json
{
  "featureName": "",
  "status": "ready | needs_fix | escalated",
  "filesWritten": [],
  "testsWritten": [],
  "validationPassed": false,
  "retryCount": 0,
  "handoffPath": ""
}
```

---

# Node 18 — Return Response

## Purpose

Return a compact JSON summary.

## Response Shape

```json
{
  "status": "ready | needs_fix | escalated | rejected",
  "featureName": "",
  "workDir": "",
  "repoDir": "",
  "handoffPath": "",
  "filesGenerated": [],
  "testsGenerated": [],
  "validationPassed": true,
  "summary": ""
}
```

---

# Environment Variables

Required:

```env
GITHUB_TOKEN=
ANTHROPIC_API_KEY=
FACTORY_TMP_ROOT=/tmp
DEFAULT_BASE_BRANCH=main
```

Optional:

```env
OPENAI_API_KEY=
FIREBASE_PROJECT_ID=
FACTORY_MAX_RETRIES=2
```

---

# Safety Rules

The workflow must never:

- commit to production repo
- push without explicit approval
- deploy
- rotate secrets
- run production payment flows
- write to production Firestore
- bypass validation
- hide failed tests

---

# Recommended n8n Node List

1. Webhook Trigger
2. Parse Request
3. Validate Plan
4. Classify Risk
5. Setup Sandbox
6. Clone Repository
7. Load Context Bundle
8. Generate Tests
9. Write Tests
10. Generate Implementation
11. Write Files
12. Run Validation
13. IF Validation Failed
14. Analyze Failure
15. Generate Patch
16. Apply Patch
17. Package Handoff
18. Return Response

---

# Future Enhancements

- PR creation
- Git patch generation
- artifact upload to storage
- Graphify context lookup
- confidence scoring
- risk-aware model routing
- auto-generated Claude Code handoff prompt
- Slack/Gmail notification
- dashboard of factory runs
