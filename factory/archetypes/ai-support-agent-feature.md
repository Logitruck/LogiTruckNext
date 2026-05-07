# AI Support Agent Feature Archetype

## Archetype Name

ai-support-agent-feature

---

# Purpose

This archetype governs all AI-powered support and operational assistant features across the LogiTruck ecosystem.

This includes:

- operational support agents
- dispatch assistants
- driver support assistants
- carrier support assistants
- customer onboarding assistants
- AI chat support
- escalation orchestration
- support automation
- workflow copilots
- internal operational assistants

This archetype is considered HIGH-RISK because AI systems interact with operational workflows, customers, dispatch decisions, and potentially sensitive business information.

---
# Production Integration Rule

Factory execution never directly modifies the real production repository.

The factory works only in:
- temporary clones
- isolated branches
- sandbox workspaces
- staging repositories

Factory output is considered an integration candidate only.

Claude Code is always responsible for:
- reviewing generated changes
- integrating into the real repository
- validating runtime behavior
- validating architecture compatibility
- validating simulator/device behavior when applicable
- committing final production-safe changes
# Strategic Role

AI support agents are part of the operational leverage model of LogiTruck.

Their goal is to:

- reduce human support load
- improve response times
- automate repetitive workflows
- assist operational actors
- improve scaling efficiency
- centralize operational intelligence
- support multilingual operations
- guide users through logistics workflows

AI support agents are assistants, not autonomous legal or operational decision makers.

---

# Approved AI Providers

Preferred:

- OpenAI
- OpenAI Realtime
- OpenAI Assistants
- Claude (planning/orchestration)
- ElevenLabs (voice layer only)

Optional:
- Retrieval systems
- Vector search
- Firebase-backed memory

Avoid:
- uncontrolled autonomous execution
- unreviewed third-party AI APIs
- AI agents with unrestricted production actions

---

# Risk Classification

| Area | Risk |
|---|---|
| Static support responses | LOW |
| Guided workflows | MEDIUM |
| Operational recommendations | HIGH |
| Automated dispatch actions | HIGH |
| Customer-facing escalations | HIGH |
| Production AI orchestration | CRITICAL |
| Autonomous operational execution | CRITICAL |

---

# Core Principles

## Human-in-the-loop

Operationally sensitive actions must support escalation.

AI agents must never silently execute critical operations.

Examples requiring escalation:
- payout issues
- route incidents
- contract disputes
- delivery disputes
- operational safety concerns
- compliance issues

---

## Context-aware responses

AI responses should leverage:

- user role
- active job state
- operational context
- conversation history
- feature-specific data
- Firebase operational state

Avoid generic chatbot behavior.

---

## Explainability

AI responses should remain understandable and auditable.

Avoid:
- opaque autonomous decisions
- unsupported operational claims
- hallucinated logistics data

---

# Factory Allowed Scope

Factory MAY:

- generate chat UI
- generate AI state reducers
- generate session handlers
- generate prompt templates
- generate Firebase persistence helpers
- generate escalation flow UI
- generate typing indicators
- generate assistant orchestration helpers
- generate mock AI adapters
- generate support workflow schemas

Factory MAY NOT:

- expose production API keys
- make autonomous production decisions
- deploy unrestricted agents
- bypass escalation rules
- trigger live operational actions without approval

---

# Claude Code Escalation Rules

Claude Code required for:

- production AI orchestration
- realtime AI integration
- AI memory architecture
- production prompt validation
- cross-service orchestration
- AI safety review
- AI escalation routing
- production deployment
- operational workflow automation

---

# Human Approval Required

Human approval required for:

- escalation policies
- customer messaging
- operational responsibility assumptions
- automated dispatch rules
- AI-generated legal/compliance guidance
- production AI rollout

---

# Recommended Architecture

## Frontend

Preferred:
- React Native chat interfaces
- bottom sheet assistant UI
- contextual assistant entrypoints
- state-driven rendering

---

## Backend

Preferred:
- Firebase Functions
- orchestration services
- AI adapters
- event-driven triggers
- isolated AI services

---

## Persistence

Preferred:
- Firestore session state
- message history
- escalation tracking
- workflow progress
- AI interaction metadata

Avoid:
- storing unnecessary raw sensitive data
- oversized transcripts in single docs

---

# Prompt Rules

Prompt templates should:

- define role clearly
- define escalation boundaries
- avoid unsupported assumptions
- include operational context
- support multilingual interaction

Prompts must avoid:
- legal advice
- guaranteed outcomes
- operational certainty claims
- unsupported safety assumptions

---

# Escalation Model

Every AI support flow should define:

- escalation trigger
- escalation destination
- escalation priority
- escalation persistence
- fallback behavior

Examples:
- transfer to human dispatcher
- create support ticket
- notify operational manager
- pause automated flow

---

# Testing Rules

Factory may test:

- reducers
- prompt builders
- state transitions
- escalation logic
- session lifecycle
- payload validation
- Firestore persistence helpers

Factory must NOT test:

- live AI APIs
- production voice calls
- unrestricted autonomous flows
- production orchestration behavior

Use mocked AI adapters.

---

# Validation Commands

```bash
./node_modules/.bin/jest src/**/__tests__ --watchAll=false --forceExit
./node_modules/.bin/tsc --noEmit
```

---

# Acceptance Criteria Expectations

Every AI support feature should define:

- supported user roles
- escalation paths
- operational boundaries
- fallback behavior
- persistence requirements
- context requirements
- auditability expectations
- multilingual requirements

---

---

## Default Building Blocks

These building blocks are always loaded for every ai-support-agent-feature plan:

| Building Block | Why Required |
|----------------|-------------|
| `hook-service-pattern` | AI chat screens use the same three-layer hook → service → Firestore architecture as all other screens. |
| `screen-hook-separation` | AI assistant UI must not contain session orchestration logic directly. All AI state flows through hooks. |
| `loading-empty-error-state` | AI screens have three states: typing/pending, response received, and error/fallback. |
| `AI-session-orchestration` | Defines the turn-by-turn Firestore persistence pattern, saveInvestorTurn model, finalizeSession, and context hydration lifecycle. |
| `testing-guide` | AI tests use mocked AI adapters. Never test against live OpenAI or ElevenLabs APIs. |

## Optional Building Blocks

Include when the feature plan declares the matching need:

| Building Block | When to Include |
|----------------|----------------|
| `AI-workflow-pipeline` | Feature involves structured data extraction from AI (Chat Completions + json_object, Responses API + json_schema, or Assistants API). |
| `assistant-session-persistence` | Feature requires persistent AI thread binding to Firestore channel (Assistants API thread-channel pattern). |
| `callable-function-pattern` | Feature has a Cloud Function backend that receives AI requests from the mobile client. |
| `callable-auth-pattern` | Cloud Function backend requires authenticated calls from signed-in users. |
| `cloud-function-structure` | Cloud Function file must follow LogiTruck import conventions and index.js export pattern. |
| `idempotent-event-processing` | AI session creation or channel creation must be idempotent (createChannelAI pattern). |

## Execution Defaults

| Property | Value |
|----------|-------|
| `executionLevelDefault` | `L1` — factory + Claude Code review |
| `riskLevelDefault` | `high` |
| `factoryCanAutoRetry` | `true` for UI and session reducers; `false` for AI orchestration |
| `requiresClaudeCodeReview` | yes — prompt safety, escalation routing, session lifecycle |
| `validationCommands` | `jest`, `tsc --noEmit` |

## Escalation Rules

| Condition | Escalation |
|-----------|-----------|
| Factory generates chat UI and session state reducers | L1 — factory can generate |
| Factory generates prompt templates and escalation UI | L1 — factory can generate |
| Production AI orchestration or realtime integration | L2 — Claude Code required |
| AI memory architecture decisions | L2 — Claude Code required |
| Escalation policies for customer-facing AI | L3 — human approval |
| Automated dispatch rules driven by AI | L3 — human approval |
| Factory cannot expose production OpenAI API keys | L4 — prohibited |
| Factory cannot deploy autonomous agents | L4 — prohibited |

---

# Future Extensions

Potential future archetype expansions:

- dispatch-ai-feature
- driver-ai-assistant-feature
- support-ticket-ai-feature
- AI-operations-copilot-feature
- fleet-ai-monitoring-feature
- investor-ai-assistant-feature
