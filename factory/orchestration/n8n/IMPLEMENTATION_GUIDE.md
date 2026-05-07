# LogiTruck Factory — n8n Workflow Implementation Guide

## Overview

This is the production-ready implementation of the LogiTruck Factory n8n workflow.

The workflow receives an `IMPLEMENTATION_PLAN.json`, creates a sandbox repo clone, generates tests,
generates implementation candidates, runs validation, supports one safe retry cycle, and packages a
Claude Code handoff.

**Core rule: the factory never touches the real production repo. Claude Code owns integration.**

---

## Workflow File

```
factory/orchestration/n8n/logitruck-factory-workflow.json
```

Import this file directly into n8n via Settings → Import Workflow.

---

## 1. Node-by-Node Workflow Plan

```
Factory Webhook          [POST /webhook/factory/execute]
    ↓
Parse Request            [Code] Normalize to data contract
    ↓
Validate Plan            [Code] Schema + safety checks
    ↓
IF Plan Valid             [IF] status !== 'rejected'
  ├── [false] → Reject Response        [Respond 400]
  └── [true]  → Classify Risk         [Code] L0/L1/L2 + model routing
                    ↓
                Setup Sandbox Cmd      [Execute Command] mkdir sandbox
                    ↓
                After Setup Sandbox    [Code] Restore data contract
                    ↓
                Clone Repository Cmd   [Execute Command] git clone
                    ↓
                After Clone Repo       [Code] Restore data contract
                    ↓
                Load Context Bundle    [Code] Build context string from plan
                    ↓
                Generate Tests API     [HTTP Request → Anthropic] test-first
                    ↓
                Parse Tests Response   [Code] Extract tests JSON
                    ↓
                Write Tests            [Code] Write to sandbox/repo
                    ↓
                Generate Implementation API  [HTTP Request → Anthropic]
                    ↓
                Parse Implementation Response  [Code]
                    ↓
                Write Files            [Code] Write to sandbox/repo only
                    ↓
                Run Validation Cmd     [Execute Command] tsc + jest (or build)
                    ↓
                Parse Validation Result  [Code] Extract pass/fail
                    ↓
                IF Validation Passed   [IF] validationPassed === true
                  ├── [true]  → Package Handoff
                  └── [false] → Analyze Failure API  [HTTP Request → Anthropic]
                                    ↓
                                Parse Failure Analysis  [Code]
                                    ↓
                                IF Retry Allowed        [IF] retryAllowed && retryCount < maxRetries
                                  ├── [false] → Package Handoff (escalated)
                                  └── [true]  → Generate Patch API  [HTTP Request → Anthropic]
                                                    ↓
                                                Parse Patch Response  [Code]
                                                    ↓
                                                Apply Patch           [Code]
                                                    ↓
                                                Run Validation Retry Cmd  [Execute Command]
                                                    ↓
                                                Parse Retry Result    [Code]
                                                    ↓
                                                Package Handoff
                                                    ↓
                                              Return Response  [Respond 200]
```

---

## 2. Code Node — Exact Source

### Node 2: Parse Request

```javascript
const body = $input.first().json;
const plan = body.implementationPlan || {};
const rawName = plan.featureName || body.featureName || 'unnamed-feature';
const featureName = rawName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const tmpRoot = process.env.FACTORY_TMP_ROOT || '/tmp';
const timestamp = Date.now();
const workDir = `${tmpRoot}/logitruck-${featureName}-${timestamp}`;
return [{
  json: {
    project: body.project || 'LogiTruck',
    featureName,
    featureArchetype: plan.featureArchetype || '',
    executionLevel: '',
    model: '',
    repoUrl: body.repoUrl || '',
    baseBranch: body.baseBranch || process.env.DEFAULT_BASE_BRANCH || 'main',
    workDir,
    repoDir: `${workDir}/repo`,
    plan,
    selectedBuildingBlocks: plan.selectedBuildingBlocks || [],
    riskLevel: plan.architectureImpact?.riskLevel || 'low',
    testsData: {},
    implData: {},
    testsWritten: [],
    filesWritten: [],
    validationOutput: '',
    validationPassed: false,
    retryCount: 0,
    maxRetries: 2,
    retryHistory: [],
    failureAnalysis: null,
    patchData: null,
    status: 'parsed',
    handoffPath: `${workDir}/handoff`,
    errors: []
  }
}];
```

### Node 3: Validate Plan

```javascript
const data = $input.first().json;
if (data.status === 'rejected') return [{ json: data }];
const plan = data.plan;
const required = [
  'featureName','featureArchetype','businessIntent','repoContext',
  'architectureImpact','automationScope','files','testingStrategy',
  'factoryExecutionPlan','acceptanceCriteria'
];
const validArchetypes = [
  'utility-feature','mobile-screen-feature','firestore-feature',
  'cloud-function-feature','maps-tracking-feature','native-integration-feature',
  'payments-stripe-connect-feature','ai-support-agent-feature',
  'voice-agent-elevenlabs-feature','landing-react-vite-feature'
];
const errors = [];
required.filter(f => !plan[f]).forEach(f => errors.push(`Missing required field: ${f}`));
if (!validArchetypes.includes(plan.featureArchetype))
  errors.push(`Invalid featureArchetype: "${plan.featureArchetype}"`);
if (!plan.files?.create?.length && !plan.files?.modify?.length)
  errors.push('files.create or files.modify must have at least one entry');
if (!plan.testingStrategy?.commands?.length)
  errors.push('testingStrategy.commands must not be empty');
if (errors.length > 0) return [{ json: { ...data, status: 'rejected', errors } }];
return [{ json: { ...data, status: 'validated' } }];
```

### Node 6: Classify Risk

```javascript
const data = $input.first().json;
const plan = data.plan;
const archetype = plan.featureArchetype;
const risk = plan.architectureImpact?.riskLevel || 'low';
const nativeRisk = plan.architectureImpact?.nativeRisk === true;
const levelMap = {
  'utility-feature': 'L0',
  'landing-react-vite-feature': 'L0',
  'mobile-screen-feature': 'L1',
  'ai-support-agent-feature': 'L1',
  'firestore-feature': (risk === 'high' || risk === 'critical') ? 'L2' : 'L1',
  'cloud-function-feature': risk === 'critical' ? 'L2' : 'L1',
  'maps-tracking-feature': nativeRisk ? 'L2' : 'L1',
  'native-integration-feature': 'L2',
  'payments-stripe-connect-feature': 'L2',
  'voice-agent-elevenlabs-feature': 'L2'
};
const executionLevel = levelMap[archetype] || 'L2';
// L0 uses Haiku (deterministic utilities), L1/L2 use Sonnet
const model = executionLevel === 'L0' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6';
const maxRetries = plan.factoryExecutionPlan?.maxRetries ?? 2;
return [{ json: { ...data, executionLevel, riskLevel: risk, model, maxRetries, status: 'classified' } }];
```

### Node 8: After Setup Sandbox

```javascript
const cmd = $input.first().json;
const data = $('Classify Risk').first().json;
if (cmd.exitCode !== 0) {
  return [{ json: { ...data, status: 'error',
    errors: [...data.errors, `Setup sandbox failed: ${cmd.stderr}`] } }];
}
return [{ json: { ...data, status: 'sandbox_ready' } }];
```

### Node 10: After Clone Repo

```javascript
const cmd = $input.first().json;
const data = $('After Setup Sandbox').first().json;
if (cmd.exitCode !== 0) {
  return [{ json: { ...data, status: 'error',
    errors: [...data.errors, `Clone failed: ${cmd.stderr}`] } }];
}
return [{ json: { ...data, status: 'cloned' } }];
```

### Node 11: Load Context Bundle

```javascript
const data = $input.first().json;
const plan = data.plan;
const blocks = (plan.selectedBuildingBlocks || []).map(b => b.name || b).join(', ');
const contextBundle = [
  `# IMPLEMENTATION PLAN\n${JSON.stringify(plan, null, 2)}`,
  `# ARCHETYPE: ${plan.featureArchetype}`,
  `# EXECUTION LEVEL: ${data.executionLevel}`,
  `# RISK LEVEL: ${data.riskLevel}`,
  `# SELECTED BUILDING BLOCKS: ${blocks || 'none specified'}`,
  `# FILES TO CREATE:\n${JSON.stringify(plan.files?.create || [], null, 2)}`,
  `# FILES TO MODIFY:\n${JSON.stringify(plan.files?.modify || [], null, 2)}`,
  `# DO NOT TOUCH:\n${JSON.stringify(plan.files?.doNotTouch || [], null, 2)}`,
  `# TESTING STRATEGY:\n${JSON.stringify(plan.testingStrategy, null, 2)}`,
  `# ACCEPTANCE CRITERIA:\n${(plan.acceptanceCriteria || []).map(c => `- ${c}`).join('\n')}`
].join('\n\n---\n\n');
return [{ json: { ...data, contextBundle, status: 'context_loaded' } }];
```

### Node 13: Parse Tests Response

```javascript
const response = $input.first().json;
const data = $('Load Context Bundle').first().json;
let tests = { tests: [] };
try {
  const raw = response.content?.[0]?.text || '{}';
  const cleaned = raw.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim();
  tests = JSON.parse(cleaned);
  if (!Array.isArray(tests.tests)) tests = { tests: [] };
} catch(e) {
  return [{ json: { ...data, status: 'error',
    errors: [...data.errors, `Failed to parse tests: ${e.message}`] } }];
}
return [{ json: { ...data, testsData: tests, status: 'tests_generated' } }];
```

### Node 14: Write Tests

```javascript
const fs = require('fs');
const path = require('path');
const data = $input.first().json;
const tests = data.testsData?.tests || [];
const repoDir = path.resolve(data.repoDir);
const written = [];
for (const test of tests) {
  if (!test.filePath || !test.content) continue;
  const resolved = path.resolve(repoDir, test.filePath);
  if (!resolved.startsWith(repoDir + path.sep) && resolved !== repoDir) {
    return [{ json: { ...data, status: 'error',
      errors: [...data.errors, `Path traversal blocked: ${test.filePath}`] } }];
  }
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, test.content, 'utf8');
  written.push(test.filePath);
}
return [{ json: { ...data, testsWritten: written, status: 'tests_written' } }];
```

### Node 16: Parse Implementation Response

```javascript
const response = $input.first().json;
const data = $('Write Tests').first().json;
let impl = { files: [] };
try {
  const raw = response.content?.[0]?.text || '{}';
  const cleaned = raw.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim();
  impl = JSON.parse(cleaned);
  if (!Array.isArray(impl.files)) impl = { files: [] };
} catch(e) {
  return [{ json: { ...data, status: 'error',
    errors: [...data.errors, `Failed to parse implementation: ${e.message}`] } }];
}
return [{ json: { ...data, implData: impl, status: 'implementation_generated' } }];
```

### Node 17: Write Files

```javascript
const fs = require('fs');
const path = require('path');
const data = $input.first().json;
const files = data.implData?.files || [];
const doNotTouch = data.plan.files?.doNotTouch || [];
const repoDir = path.resolve(data.repoDir);
const written = [];
for (const file of files) {
  if (!file.filePath || !file.content) continue;
  if (doNotTouch.some(p => file.filePath.includes(p))) {
    return [{ json: { ...data, status: 'error',
      errors: [...data.errors, `Protected file blocked: ${file.filePath}`] } }];
  }
  const resolved = path.resolve(repoDir, file.filePath);
  if (!resolved.startsWith(repoDir + path.sep) && resolved !== repoDir) {
    return [{ json: { ...data, status: 'error',
      errors: [...data.errors, `Path traversal blocked: ${file.filePath}`] } }];
  }
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, file.content, 'utf8');
  written.push(file.filePath);
}
return [{ json: { ...data, filesWritten: written, status: 'files_written' } }];
```

### Node 19: Parse Validation Result

```javascript
const cmd = $input.first().json;
const data = $('Write Files').first().json;
const passed = cmd.exitCode === 0;
const output = `VALIDATION ATTEMPT 1\nEXIT_CODE: ${cmd.exitCode}\n\nSTDOUT:\n${cmd.stdout}\n\nSTDERR:\n${cmd.stderr}`;
return [{ json: { ...data, validationOutput: output, validationPassed: passed,
  status: passed ? 'validation_passed' : 'validation_failed' } }];
```

### Node 22: Parse Failure Analysis

```javascript
const response = $input.first().json;
const data = $('Parse Validation Result').first().json;
let analysis = { retryAllowed: false, failureType: 'unknown',
  rootCause: 'Could not parse failure analysis', patchInstructions: '' };
try {
  const raw = response.content?.[0]?.text || '{}';
  const cleaned = raw.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim();
  analysis = JSON.parse(cleaned);
} catch(e) {
  analysis.rootCause = `Parse error: ${e.message}`;
}
const retryAllowed = analysis.retryAllowed === true && data.retryCount < data.maxRetries;
return [{ json: { ...data, failureAnalysis: analysis, retryAllowed, status: 'failure_analyzed' } }];
```

### Node 25: Parse Patch Response

```javascript
const response = $input.first().json;
const data = $('Parse Failure Analysis').first().json;
let patch = { patches: [], reason: 'No patches generated' };
try {
  const raw = response.content?.[0]?.text || '{}';
  const cleaned = raw.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim();
  patch = JSON.parse(cleaned);
  if (!Array.isArray(patch.patches)) patch = { patches: [], reason: 'Invalid patch format' };
} catch(e) {
  patch = { patches: [], reason: `Parse error: ${e.message}` };
}
return [{ json: { ...data, patchData: patch, status: 'patch_generated' } }];
```

### Node 26: Apply Patch

```javascript
const fs = require('fs');
const path = require('path');
const data = $input.first().json;
const patches = data.patchData?.patches || [];
const doNotTouch = data.plan.files?.doNotTouch || [];
const repoDir = path.resolve(data.repoDir);
const patchedFiles = [];
for (const patch of patches) {
  if (!patch.filePath || !patch.content) continue;
  if (doNotTouch.some(p => patch.filePath.includes(p))) continue;
  const resolved = path.resolve(repoDir, patch.filePath);
  if (!resolved.startsWith(repoDir + path.sep) && resolved !== repoDir) continue;
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, patch.content, 'utf8');
  patchedFiles.push(patch.filePath);
}
const retryEntry = {
  attempt: data.retryCount + 1,
  failureType: data.failureAnalysis?.failureType,
  rootCause: data.failureAnalysis?.rootCause,
  patchedFiles,
  reason: data.patchData?.reason
};
return [{ json: { ...data,
  retryCount: data.retryCount + 1,
  retryHistory: [...data.retryHistory, retryEntry],
  status: 'patch_applied' } }];
```

### Node 28: Parse Retry Result

```javascript
const cmd = $input.first().json;
const data = $('Apply Patch').first().json;
const passed = cmd.exitCode === 0;
const output = `VALIDATION ATTEMPT ${data.retryCount}\nEXIT_CODE: ${cmd.exitCode}\n\nSTDOUT:\n${cmd.stdout}\n\nSTDERR:\n${cmd.stderr}`;
return [{ json: { ...data, validationOutput: output, validationPassed: passed,
  status: passed ? 'retry_passed' : 'retry_failed' } }];
```

### Node 29: Package Handoff

See full source in `logitruck-factory-workflow.json` node `node-29-package-handoff`.
The logic:
1. Creates all handoff files in `$WORK_DIR/handoff/`
2. Writes `IMPLEMENTATION_PLAN.json`, `validation-output.txt`, `retry-summary.md`,
   `risk-notes.md`, `claude-integration-steps.md`, `rollback-plan.md`, `manifest.json`
3. Sets `finalStatus` = `ready | needs_fix | escalated`

---

## 3. Execute Command Nodes — Exact Shell Commands

### Node 7: Setup Sandbox Cmd

```bash
set -e
WORK_DIR="{{ $json.workDir }}"
# Safety: workDir must be under /tmp or /var/folders (macOS)
if [[ "$WORK_DIR" != /tmp/* ]] && [[ "$WORK_DIR" != /private/tmp/* ]] && [[ "$WORK_DIR" != /var/folders/* ]]; then
  echo "ERROR: workDir safety check failed: $WORK_DIR" >&2
  exit 1
fi
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR/handoff/generated-files"
mkdir -p "$WORK_DIR/handoff/tests"
mkdir -p "$WORK_DIR/logs"
echo "sandbox_ready"
```

### Node 9: Clone Repository Cmd

```bash
REPO_DIR="{{ $json.repoDir }}"
REPO_URL="{{ $json.repoUrl }}"
BASE_BRANCH="{{ $json.baseBranch }}"
# GITHUB_TOKEN must be pre-configured in n8n environment or git credential store
git clone --depth 1 --branch "$BASE_BRANCH" "$REPO_URL" "$REPO_DIR" 2>&1 | tail -5
echo "clone_complete"
```

> Note: Configure git credentials via `git config --global credential.helper store` and a
> pre-populated `~/.git-credentials` file in the n8n server environment. Do not inject
> `GITHUB_TOKEN` directly into the URL to avoid token exposure in logs.

### Node 18: Run Validation Cmd

```bash
REPO_DIR="{{ $json.repoDir }}"
ARCHETYPE="{{ $json.featureArchetype }}"
cd "$REPO_DIR"
NODE_ENV=development npm install --include=dev --legacy-peer-deps 2>&1 | tail -3
EXIT_CODE=0
if [[ "$ARCHETYPE" == "landing-react-vite-feature" ]]; then
  npm run build 2>&1 || EXIT_CODE=$?
else
  ./node_modules/.bin/tsc --noEmit 2>&1 || EXIT_CODE=$?
  ./node_modules/.bin/jest --watchAll=false --forceExit --passWithNoTests 2>&1 || EXIT_CODE=$?
fi
echo "FACTORY_EXIT_CODE=$EXIT_CODE"
exit $EXIT_CODE
```

### Node 27: Run Validation Retry Cmd

```bash
REPO_DIR="{{ $json.repoDir }}"
ARCHETYPE="{{ $json.featureArchetype }}"
cd "$REPO_DIR"
EXIT_CODE=0
if [[ "$ARCHETYPE" == "landing-react-vite-feature" ]]; then
  npm run build 2>&1 || EXIT_CODE=$?
else
  ./node_modules/.bin/tsc --noEmit 2>&1 || EXIT_CODE=$?
  ./node_modules/.bin/jest --watchAll=false --forceExit --passWithNoTests 2>&1 || EXIT_CODE=$?
fi
echo "FACTORY_EXIT_CODE=$EXIT_CODE"
exit $EXIT_CODE
```

---

## 4. Anthropic HTTP Request Nodes — Exact Prompts

### Node 12: Generate Tests API

**System prompt:**
```
You are the LogiTruck Factory test generator. You generate Jest/TypeScript tests.
Return ONLY valid JSON — no markdown, no code blocks, no explanation. Strict JSON output only.
```

**User message:**
```
Generate Jest tests for this feature.

IMPLEMENTATION PLAN:
{{ JSON.stringify($json.plan, null, 2) }}

FILES TO CREATE:
{{ JSON.stringify($json.plan.files?.create, null, 2) }}

TESTING STRATEGY:
{{ JSON.stringify($json.plan.testingStrategy, null, 2) }}

ACCEPTANCE CRITERIA:
{{ ($json.plan.acceptanceCriteria || []).map(c => '- ' + c).join('\n') }}

RULES:
- Pure utilities: import directly, no renderHook, no React Testing Library
- Hooks: use renderHook from @testing-library/react-native
- Tests must fail before implementation exists, pass after
- No real Firebase/Stripe/OpenAI/ElevenLabs calls — use jest.mock()
- Test edge cases and error paths
- Use describe/it blocks with clear names

Output this JSON structure only:
{
  "tests": [
    {
      "filePath": "src/utils/__tests__/example.test.ts",
      "content": "import..."
    }
  ]
}
```

**Model routing:** `$json.model` (Haiku for L0, Sonnet for L1/L2)
**max_tokens:** 8096
**timeout:** 120s

---

### Node 15: Generate Implementation API

**System prompt:**
```
You are the LogiTruck Factory implementation generator. Generate TypeScript implementation files
that make the provided tests pass. Return ONLY valid JSON — no markdown, no code blocks, no explanation.
```

**User message:**
```
Generate implementation files for this feature.

IMPLEMENTATION PLAN:
{{ JSON.stringify($json.plan, null, 2) }}

GENERATED TESTS (your code must make these pass):
{{ JSON.stringify($json.testsData, null, 2) }}

FILES TO CREATE:
{{ JSON.stringify($json.plan.files?.create, null, 2) }}

FILES TO MODIFY:
{{ JSON.stringify($json.plan.files?.modify, null, 2) }}

DO NOT TOUCH:
{{ JSON.stringify($json.plan.files?.doNotTouch || [], null, 2) }}

EXISTING PATTERNS TO FOLLOW:
{{ ($json.plan.repoContext?.existingPatternsToFollow || []).join('\n') }}

ANTI-PATTERNS TO AVOID:
{{ ($json.plan.repoContext?.knownAntiPatternsToAvoid || []).join('\n') }}

RULES:
- Reuse existing patterns from repoContext
- Avoid new dependencies unless the plan explicitly allows them
- Pure functions must be deterministic and side-effect free
- Use explicit TypeScript types and explicit return types
- No "any" types
- No hidden Firebase/network/native calls in utilities
- This is a sandbox integration candidate only

Output this JSON structure only:
{
  "files": [
    {
      "filePath": "src/utils/example.ts",
      "content": "export..."
    }
  ]
}
```

**Model routing:** `$json.model`
**max_tokens:** 8096
**timeout:** 120s

---

### Node 21: Analyze Failure API

**System prompt:**
```
You are the LogiTruck Factory failure analyzer. Classify validation failures as
safe-to-retry or escalation-required. Return ONLY valid JSON.
```

**User message:**
```
Analyze this validation failure.

VALIDATION OUTPUT:
{{ $json.validationOutput }}

FILES WRITTEN:
{{ JSON.stringify($json.filesWritten) }}

TESTS WRITTEN:
{{ JSON.stringify($json.testsWritten) }}

RETRY COUNT: {{ $json.retryCount }} / {{ $json.maxRetries }}

SAFE TO RETRY (retryAllowed: true):
- TypeScript errors
- Missing imports
- Failing isolated tests
- Wrong file paths
- Mock setup errors
- Formatting/parsing issues
- Simple logic mismatches

MUST ESCALATE (retryAllowed: false):
- Native build failure
- Dependency conflict
- Expo plugin issue
- Stripe/payment production errors
- Firestore security rules
- AI runtime orchestration errors
- Retry limit already reached
- Unknown runtime errors without clear cause

Output JSON only:
{
  "retryAllowed": true,
  "failureType": "typescript | missing-import | failing-test | path-error | mock-error | native-build | dependency-conflict | unknown",
  "rootCause": "...",
  "patchInstructions": "concise instructions for fixing the errors"
}
```

**Model:** `claude-haiku-4-5-20251001` (always — cost-sensitive classification step)
**max_tokens:** 2048
**timeout:** 60s

---

### Node 24: Generate Patch API

**System prompt:**
```
You are the LogiTruck Factory patch generator. Fix TypeScript/Jest errors in generated files.
Return ONLY valid JSON — no markdown, no code blocks, no explanation.
```

**User message:**
```
Generate patches to fix these validation errors.

VALIDATION OUTPUT:
{{ $json.validationOutput }}

FAILURE ANALYSIS:
{{ JSON.stringify($json.failureAnalysis, null, 2) }}

IMPLEMENTATION PLAN:
{{ JSON.stringify($json.plan, null, 2) }}

FILES WRITTEN:
{{ JSON.stringify($json.filesWritten) }}

TESTS WRITTEN:
{{ JSON.stringify($json.testsWritten) }}

RULES:
- Only fix what is broken — do not rewrite everything
- Do not introduce new dependencies
- Do not touch files in plan.files.doNotTouch: {{ JSON.stringify($json.plan.files?.doNotTouch || []) }}
- Return COMPLETE file content for each patched file (not diffs)
- Match the original file intent from the implementation plan

Output JSON only:
{
  "patches": [
    {
      "filePath": "src/utils/example.ts",
      "content": "export..."
    }
  ],
  "reason": "what was fixed and why"
}
```

**Model routing:** `$json.model`
**max_tokens:** 8096
**timeout:** 120s

---

## 5. Expected JSON Input and Output Per Node

### Node 1: Factory Webhook — Input

```json
{
  "project": "LogiTruck",
  "repoUrl": "https://github.com/org/logitruck-next.git",
  "baseBranch": "main",
  "implementationPlan": {
    "featureName": "use-miles-to-km",
    "featureArchetype": "utility-feature",
    "businessIntent": { "problem": "...", "expectedOutcome": "..." },
    "repoContext": { "relevantModules": [], "referenceFiles": [], "existingPatternsToFollow": [] },
    "architectureImpact": { "riskLevel": "low", "nativeRisk": false },
    "automationScope": { "factoryCanCreate": ["src/utils/milesToKm.ts"] },
    "files": {
      "create": [{ "filePath": "src/utils/milesToKm.ts", "description": "Miles to km converter" }],
      "modify": [],
      "doNotTouch": []
    },
    "testingStrategy": { "testType": "pure-unit", "commands": ["./node_modules/.bin/jest src/utils/__tests__ --watchAll=false --forceExit"] },
    "factoryExecutionPlan": { "steps": [], "maxRetries": 2, "handoffRequired": true },
    "acceptanceCriteria": ["milesToKm(1) returns 1.609", "milesToKm(0) returns 0"]
  }
}
```

### Node 2: Parse Request — Output

```json
{
  "project": "LogiTruck",
  "featureName": "use-miles-to-km",
  "featureArchetype": "utility-feature",
  "executionLevel": "",
  "model": "",
  "repoUrl": "https://github.com/org/logitruck-next.git",
  "baseBranch": "main",
  "workDir": "/tmp/logitruck-use-miles-to-km-1746576000000",
  "repoDir": "/tmp/logitruck-use-miles-to-km-1746576000000/repo",
  "plan": { "...": "full plan object" },
  "selectedBuildingBlocks": [],
  "riskLevel": "low",
  "testsData": {},
  "implData": {},
  "testsWritten": [],
  "filesWritten": [],
  "validationOutput": "",
  "validationPassed": false,
  "retryCount": 0,
  "maxRetries": 2,
  "retryHistory": [],
  "failureAnalysis": null,
  "patchData": null,
  "status": "parsed",
  "handoffPath": "/tmp/logitruck-use-miles-to-km-1746576000000/handoff",
  "errors": []
}
```

### Node 6: Classify Risk — Output (additions)

```json
{
  "executionLevel": "L0",
  "model": "claude-haiku-4-5-20251001",
  "maxRetries": 2,
  "status": "classified"
}
```

### Node 12: Generate Tests API — Anthropic Response Shape

```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"tests\":[{\"filePath\":\"src/utils/__tests__/milesToKm.test.ts\",\"content\":\"import { milesToKm } from '../milesToKm';\\n\\ndescribe('milesToKm', () => {\\n  it('converts 1 mile to km', () => { expect(milesToKm(1)).toBeCloseTo(1.609); });\\n  it('returns 0 for 0 miles', () => { expect(milesToKm(0)).toBe(0); });\\n});\"}]}"
    }
  ],
  "model": "claude-haiku-4-5-20251001",
  "stop_reason": "end_turn"
}
```

### Node 20: IF Validation Passed — Branch Logic

```
true output  → $json.validationPassed === true → Package Handoff
false output → $json.validationPassed === false → Analyze Failure API
```

### Node 29: Package Handoff — Output (additions)

```json
{
  "finalStatus": "ready",
  "manifest": {
    "featureName": "use-miles-to-km",
    "featureArchetype": "utility-feature",
    "executionLevel": "L0",
    "riskLevel": "low",
    "status": "ready",
    "filesWritten": ["src/utils/milesToKm.ts"],
    "testsWritten": ["src/utils/__tests__/milesToKm.test.ts"],
    "validationPassed": true,
    "retryCount": 0,
    "handoffPath": "/tmp/logitruck-use-miles-to-km-1746576000000/handoff",
    "timestamp": "2026-05-06T12:00:00.000Z"
  },
  "status": "handoff_packaged"
}
```

### Node 30: Return Response — Final Response Body

```json
{
  "status": "ready",
  "featureName": "use-miles-to-km",
  "featureArchetype": "utility-feature",
  "executionLevel": "L0",
  "workDir": "/tmp/logitruck-use-miles-to-km-1746576000000",
  "repoDir": "/tmp/logitruck-use-miles-to-km-1746576000000/repo",
  "handoffPath": "/tmp/logitruck-use-miles-to-km-1746576000000/handoff",
  "filesGenerated": ["src/utils/milesToKm.ts"],
  "testsGenerated": ["src/utils/__tests__/milesToKm.test.ts"],
  "validationPassed": true,
  "retryCount": 0,
  "errors": [],
  "summary": "Factory run complete. Status: ready. Validation: PASSED. Files: 1. Tests: 1."
}
```

---

## 6. Test curl Command (webhook-test)

```bash
curl -X POST \
  http://localhost:5678/webhook-test/factory/execute \
  -H "Content-Type: application/json" \
  -d '{
    "project": "LogiTruck",
    "repoUrl": "https://github.com/YOUR_ORG/logitruck-next.git",
    "baseBranch": "main",
    "implementationPlan": {
      "featureName": "use-miles-to-km",
      "featureArchetype": "utility-feature",
      "summary": "Pure TypeScript conversion utility",
      "businessIntent": {
        "problem": "App displays distances in meters but drivers expect miles and km",
        "affectedRoles": ["driver", "dispatcher"],
        "expectedOutcome": "Reliable milesToKm converter reused across the app",
        "operationalCriticality": "low"
      },
      "selectedBuildingBlocks": [],
      "repoContext": {
        "projectsAffected": ["logitruck-next"],
        "relevantModules": ["src/utils"],
        "referenceFiles": [],
        "existingPatternsToFollow": ["pure function, explicit types, no side effects"],
        "knownAntiPatternsToAvoid": ["implicit any", "mutation"]
      },
      "architectureImpact": {
        "riskLevel": "low",
        "nativeRisk": false,
        "touchesFirebase": false,
        "touchesNavigation": false,
        "touchesCloudFunctions": false,
        "touchesPayments": false,
        "touchesAI": false,
        "touchesLanding": false,
        "requiresHumanApproval": false
      },
      "automationScope": {
        "factorySandboxOnly": true,
        "factoryCanGenerate": ["src/utils/milesToKm.ts", "src/utils/__tests__/milesToKm.test.ts"],
        "factoryCanValidate": ["jest", "tsc"],
        "claudeCodeMustIntegrate": true,
        "claudeCodeOnly": [],
        "humanApprovalRequired": []
      },
      "files": {
        "create": [
          {
            "filePath": "src/utils/milesToKm.ts",
            "project": "logitruck-next",
            "description": "Converts miles to kilometers",
            "buildingBlocks": [],
            "risk": "low"
          }
        ],
        "modify": [],
        "doNotTouch": ["ios/", "android/", "app.json", "eas.json", "firestore.rules"]
      },
      "testingStrategy": {
        "testFirst": true,
        "testType": "pure-unit",
        "requiredMocks": [],
        "avoid": ["renderHook", "React Testing Library"],
        "commands": [
          "./node_modules/.bin/jest src/utils/__tests__ --watchAll=false --forceExit",
          "./node_modules/.bin/tsc --noEmit"
        ]
      },
      "validationStrategy": {
        "sandboxCommands": [
          "NODE_ENV=development npm install --include=dev --legacy-peer-deps",
          "./node_modules/.bin/jest src/utils/__tests__ --watchAll=false --forceExit",
          "./node_modules/.bin/tsc --noEmit"
        ],
        "expectedPassingSignals": ["PASS src/utils/__tests__/milesToKm.test.ts", "0 errors"],
        "failureEscalationRules": ["native build failure escalates to Claude Code"]
      },
      "factoryExecutionPlan": {
        "steps": [
          "Generate test file for milesToKm",
          "Generate milesToKm implementation",
          "Run tsc and jest",
          "Package handoff"
        ],
        "maxRetries": 2,
        "handoffRequired": true,
        "handoffPackage": {
          "includeGeneratedFiles": true,
          "includeTestResults": true,
          "includeValidationOutput": true,
          "includeRiskNotes": true,
          "includeClaudeCodeIntegrationSteps": true
        }
      },
      "claudeCodeIntegrationPlan": {
        "required": true,
        "reason": "Factory output is a sandbox integration candidate only.",
        "steps": [
          "Review milesToKm.ts for correctness",
          "Copy src/utils/milesToKm.ts to production repo",
          "Run tsc and jest in production repo",
          "Commit with: feat(utils): add milesToKm conversion utility"
        ],
        "runtimeValidation": [],
        "simulatorValidation": [],
        "finalCommitChecklist": ["tsc passes", "jest passes", "no secrets committed"]
      },
      "rollbackPlan": {
        "required": false,
        "steps": ["Delete generated file — no production changes were made by factory"]
      },
      "acceptanceCriteria": [
        "milesToKm(1) returns approximately 1.609",
        "milesToKm(0) returns 0",
        "milesToKm accepts negative values",
        "Function is pure with no side effects",
        "TypeScript types are explicit"
      ],
      "openQuestions": []
    }
  }'
```

---

## 7. Production curl Command (webhook)

```bash
curl -X POST \
  https://YOUR_N8N_HOST/webhook/factory/execute \
  -H "Content-Type: application/json" \
  -H "X-Factory-Token: $FACTORY_WEBHOOK_SECRET" \
  -d @IMPLEMENTATION_PLAN.json
```

> Replace `YOUR_N8N_HOST` with your n8n instance domain.
> The workflow does not currently validate `X-Factory-Token` — add webhook authentication
> in n8n's workflow settings under Credentials if you expose this to the network.

---

## 8. Required Environment Variables

Set these in your n8n instance under **Settings → Variables** or in the n8n server's `.env` file.

### Required

```env
ANTHROPIC_API_KEY=sk-ant-REPLACE_ME
FACTORY_TMP_ROOT=/tmp
DEFAULT_BASE_BRANCH=main
```

### Required for private repos

```env
GITHUB_TOKEN=ghp_REPLACE_ME
```

Configure the token via git credential store on the n8n server:
```bash
git config --global credential.helper store
echo "https://x-token:${GITHUB_TOKEN}@github.com" >> ~/.git-credentials
```

### Optional

```env
FACTORY_MAX_RETRIES=2
OPENAI_API_KEY=sk-REPLACE_ME
FIREBASE_PROJECT_ID=logitruck-production
```

### n8n Environment Variable Access

In n8n Code nodes: `process.env.ANTHROPIC_API_KEY`
In n8n expression fields: `{{ $env.ANTHROPIC_API_KEY }}`

---

## 9. Handoff Package Folder Structure

Every factory run writes its output to:

```
$FACTORY_TMP_ROOT/logitruck-<featureName>-<timestamp>/handoff/
├── IMPLEMENTATION_PLAN.json          ← original plan
├── generated-files/                  ← symlink dir (actual files are in repo/)
├── tests/                            ← symlink dir (actual tests are in repo/)
├── validation-output.txt             ← stdout+stderr from tsc+jest
├── retry-summary.md                  ← retry history if any
├── risk-notes.md                     ← risk classification, errors
├── claude-integration-steps.md       ← step-by-step guide for Claude Code
├── rollback-plan.md                  ← rollback instructions
└── manifest.json                     ← machine-readable run summary
```

### manifest.json shape

```json
{
  "featureName": "use-miles-to-km",
  "featureArchetype": "utility-feature",
  "executionLevel": "L0",
  "riskLevel": "low",
  "status": "ready | needs_fix | escalated",
  "filesWritten": ["src/utils/milesToKm.ts"],
  "testsWritten": ["src/utils/__tests__/milesToKm.test.ts"],
  "validationPassed": true,
  "retryCount": 0,
  "handoffPath": "/tmp/logitruck-use-miles-to-km-1746576000000/handoff",
  "timestamp": "2026-05-06T12:00:00.000Z"
}
```

### Status meanings

| Status | Meaning |
|---|---|
| `ready` | Validation passed. Claude Code can integrate. |
| `needs_fix` | Retry attempted, still failing. Review errors in handoff. |
| `escalated` | Failure type is not safe to retry. Claude Code must diagnose. |
| `rejected` | Plan failed schema validation before execution started. |
| `error` | Workflow infrastructure error (sandbox, clone, write). |

---

## 10. Validation Checklist

### Before importing workflow

- [ ] n8n instance is self-hosted (Execute Command nodes require local execution)
- [ ] `ANTHROPIC_API_KEY` is set in n8n environment
- [ ] `FACTORY_TMP_ROOT` resolves to a writable directory (`/tmp` on Linux/Mac)
- [ ] `git` is available in the n8n server's `PATH`
- [ ] `node` and `npm` are available in the n8n server's `PATH`
- [ ] Git credential store is configured for private repos
- [ ] n8n Code nodes have access to Node.js built-ins (`fs`, `path`, `child_process`)
  - On n8n self-hosted: add `NODE_FUNCTION_ALLOW_BUILTIN=fs,path` to n8n env

### Before first production run

- [ ] Test with the curl command in section 6 (webhook-test URL)
- [ ] Verify sandbox is created at correct path
- [ ] Verify repo clones successfully
- [ ] Verify Anthropic API returns valid JSON (not markdown-wrapped)
- [ ] Verify files are written to sandbox only — never to production repo
- [ ] Verify handoff package is complete at `handoffPath`
- [ ] Verify Return Response sends valid JSON with `status` field
- [ ] Check n8n execution logs for any expression resolution errors

### For each factory run

- [ ] `implementationPlan.featureArchetype` is a valid archetype
- [ ] `implementationPlan.files.doNotTouch` includes protected areas
- [ ] `implementationPlan.testingStrategy.commands` is not empty
- [ ] `repoUrl` is accessible from the n8n server
- [ ] `baseBranch` exists in the remote repo
- [ ] Factory output is never pushed to remote — Claude Code owns that step

### After handoff

- [ ] Claude Code reviews `manifest.json` status
- [ ] If `status === 'escalated'`, Claude Code diagnoses before integrating
- [ ] If `status === 'needs_fix'`, Claude Code reviews `retry-summary.md` and `validation-output.txt`
- [ ] Claude Code reads `claude-integration-steps.md` before applying to production repo
- [ ] Claude Code runs `tsc` and `jest` in the real production repo after integration
- [ ] Claude Code validates runtime behavior when archetype is L1 or L2
- [ ] Final commit uses format: `feat(<area>): <description>`

---

## Node Count Summary

| # | Node Name | Type |
|---|---|---|
| 1 | Factory Webhook | Webhook |
| 2 | Parse Request | Code |
| 3 | Validate Plan | Code |
| 4 | IF Plan Valid | IF |
| 5 | Reject Response | Respond to Webhook |
| 6 | Classify Risk | Code |
| 7 | Setup Sandbox Cmd | Execute Command |
| 8 | After Setup Sandbox | Code |
| 9 | Clone Repository Cmd | Execute Command |
| 10 | After Clone Repo | Code |
| 11 | Load Context Bundle | Code |
| 12 | Generate Tests API | HTTP Request (Anthropic) |
| 13 | Parse Tests Response | Code |
| 14 | Write Tests | Code |
| 15 | Generate Implementation API | HTTP Request (Anthropic) |
| 16 | Parse Implementation Response | Code |
| 17 | Write Files | Code |
| 18 | Run Validation Cmd | Execute Command |
| 19 | Parse Validation Result | Code |
| 20 | IF Validation Passed | IF |
| 21 | Analyze Failure API | HTTP Request (Anthropic) |
| 22 | Parse Failure Analysis | Code |
| 23 | IF Retry Allowed | IF |
| 24 | Generate Patch API | HTTP Request (Anthropic) |
| 25 | Parse Patch Response | Code |
| 26 | Apply Patch | Code |
| 27 | Run Validation Retry Cmd | Execute Command |
| 28 | Parse Retry Result | Code |
| 29 | Package Handoff | Code |
| 30 | Return Response | Respond to Webhook |

**Total: 30 nodes**
**Anthropic API calls per run: 2 (happy path) or 4 (with one retry)**
**Execute Command calls per run: 3 (happy path) or 4 (with one retry)**
