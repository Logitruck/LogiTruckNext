
# LogiTruck Factory Architect

## Mission

The LogiTruck Factory is an AI-native software delivery system designed to safely automate feature generation across the LogiTruck platform ecosystem.

The factory supports:
- React Native mobile applications
- Firebase Cloud Functions
- React/Vite landing pages
- AI support systems
- Voice agents
- Realtime tracking systems
- Firebase orchestration
- Stripe integrations
- n8n automations

The factory must preserve architectural integrity while reducing repetitive engineering work.

---

# Core Principles

## Claude Code Responsibilities

Claude Code performs:
- high-level reasoning
- architecture analysis
- repo understanding
- native integrations
- dependency validation
- complex orchestration
- production-safe reviews

## Factory Responsibilities

The factory performs:
- deterministic generation
- utility creation
- hook generation
- isolated component generation
- test generation
- validation execution
- isolated retries
- patch application

---

## Production Repository Rule

The factory must never directly modify the production repository.

The factory works only in:
- temporary clone
- isolated branch
- sandbox workspace
- staging repository

Factory output is an integration candidate.

Claude Code is always responsible for:
- reviewing the generated changes
- integrating into the real repository
- validating runtime behavior
- committing final changes

# Safety Model

The factory MUST NOT:
- blindly modify native configuration
- auto-install native dependencies
- modify protected files
- bypass architectural rules

Native-risk operations require Claude Code escalation.

---

# Supported Platforms

## Mobile
- Expo Bare Workflow
- React Native
- TypeScript
- Firebase Web SDK

## Backend
- Firebase Functions v2
- Firestore
- Cloud Tasks
- Event-driven architecture

## Web
- React
- Vite
- AI-driven landing systems

## AI Systems
- OpenAI
- ElevenLabs
- Realtime Agents
- Voice orchestration
- AI support agents

---

# Execution Philosophy

Claude Architect:
- thinks strategically

Factory:
- executes deterministically

Validation:
- protects repository integrity

---

# Planning Requirements

Every implementation plan MUST include:
- business intent
- architecture impact
- repo context
- testing strategy
- execution scope
- risk classification
- escalation requirements
- acceptance criteria

---

# Risk Levels

LOW:
- utilities
- isolated hooks
- tests

MEDIUM:
- screens
- firestore hooks
- cloud functions

HIGH:
- navigation
- realtime tracking
- maps
- auth flows

CRITICAL:
- native dependencies
- build systems
- Expo plugins
- payment infrastructure

---

# Escalation Rules

Claude Code escalation required for:
- Mapbox integration
- Stripe Connect production setup
- Expo plugin changes
- Pods / Gradle changes
- build failures
- Hermes issues
- Firebase native modules
- production deployment issues

---

# Validation Requirements

Every generated feature must pass:
- Jest validation
- TypeScript validation
- repository compatibility validation

---

# Repo-Aware Development

The factory must:
- reuse existing patterns
- inspect similar files
- preserve naming conventions
- avoid unnecessary abstractions
- follow existing architecture

---

# Cost Optimization

Claude Code should minimize:
- repetitive implementation
- deterministic generation
- repetitive retries

The factory should maximize:
- scalable execution
- reusable automation
- low-cost deterministic workflows

---

# Discovery Protocol

## When to run

MANDATORY before creating any implementation plan for a feature with:
- 2 or more plans
- MEDIUM or higher risk level
- any screen, navigator, or role change

## Pipeline order

Run each stage in sequence. Do not skip.

```
1. feature-intake.md       — business context, role, archetype classification
2. factory-readiness-check.md — audit: does factory support this? gaps? reference files?
3. feature-deep-dive.md    — technical questions by archetype (only relevant sections)
4. feature-confirmation.md — final validation before plan creation
```

## Rules

- Ask only what the user has not already provided.
- Do not explore the repo during intake — ask the user first, then do targeted lookups only on files they reference.
- Do not generate implementation code during any intake stage.
- After readiness check: if blockers exist, present them and wait for a decision before proceeding.
- Output of the full pipeline: master design + N individual plan files + factory readiness report.

---

# Feature Progress Tracking

## When to create a PROGRESS.md

For any feature with 3 or more implementation plans, create:

```
factory/features/<feature-slug>/
├── PROGRESS.md         ← copy from factory/features/PROGRESS_TEMPLATE.md
├── DESIGN.md           ← master design decisions (optional, for complex features)
└── plans/
    ├── piece-one.plan.json
    └── piece-two.plan.json
```

## Rules

- Read PROGRESS.md at the START of every session that continues an in-progress feature.
- Update PROGRESS.md at the END of every session before responding to the user.
- Mark each piece as integrated only after it has been committed to the production repo.
- If a session ends due to context limits, update PROGRESS.md with current state and "What's next" before the session ends.
- A piece is NOT done until it is integrated — factory passing alone is not enough.

## Status values

`pending` → `running` → `passed` → `integrated`
`failed` → `blocked` (needs resolution before retrying)

---

# Dependency Gate

## When to trigger

If during discovery, design, or implementation Claude Code identifies:
- A library not present in `package.json`
- A major version upgrade of an existing dependency
- A new Expo plugin
- Any change to `ios/Podfile`, `android/build.gradle`, or `app.json` plugins section

## Rule: STOP immediately

Do NOT:
- proceed with feature design or plan creation
- assume the dependency can be installed without impact
- install the dependency without user approval

## Present this report to the user

```
## Dependency Gate — [library-name@version]

### Why it is needed
[specific reason for this feature]

### Dependency type
- [ ] JS-only (low risk — npm install only)
- [ ] Native module (HIGH risk — requires native rebuild)
- [ ] Expo plugin (CRITICAL — requires expo prebuild)

### Files that would be modified
- package.json
- ios/Podfile (requires pod install)           [if native]
- android/build.gradle                          [if native]
- app.json plugins section                      [if Expo plugin]
- ios/GoogleService-Info.plist (loss risk)      [if prebuild required]

### Risks
- [specific risk 1]
- [specific risk 2]

### Recovery plan if it breaks
1. git checkout package.json [and other affected files]
2. rm -rf node_modules && npm install
3. [restore Podfile.lock from previous commit if native]
4. [restore ios/ android/ from git if prebuild was run]

### Alternative without new dependency
[or "no viable alternative"]

### Validation required before continuing
- [ ] User approval
- [ ] npm install succeeds without peer-dep errors
- [ ] iOS build succeeds on simulator          [if native]
- [ ] Android build succeeds on emulator       [if native]
- [ ] Existing feature X still works (regression) [specify which]
```

## After approval

1. Install the dependency.
2. Validate each item in the checklist above.
3. Commit the dependency change separately (before the feature code).
4. Only then continue with the feature design and plan creation.

Dependency installation is its own commit — never bundled with feature code.
