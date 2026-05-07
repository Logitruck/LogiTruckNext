# Voice Agent ElevenLabs Feature Archetype

## Archetype Name

voice-agent-elevenlabs-feature

---

# Purpose

This archetype governs all realtime voice agent experiences across the LogiTruck ecosystem.

This includes:

- AI voice onboarding
- investor voice assistants
- driver voice assistants
- operational support voice agents
- realtime conversational agents
- embedded landing voice agents
- voice-enabled dispatch assistance
- voice qualification systems
- AI voice copilots

This archetype is classified as HIGH to CRITICAL risk due to realtime behavior, latency sensitivity, operational context, and customer-facing interaction.

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

Voice agents are part of the AI-native operational leverage strategy of LogiTruck.

Their goals include:

- improving onboarding conversion
- scaling support operations
- reducing human operational load
- qualifying leads automatically
- guiding users conversationally
- assisting drivers hands-free
- improving operational accessibility
- enabling realtime AI interactions

Voice agents assist humans.
They do NOT autonomously control operations.

---

# Approved Voice Stack

Preferred:

- ElevenLabs
- OpenAI Realtime
- WebRTC
- Firebase persistence
- Realtime orchestration adapters

Optional:
- Twilio voice routing
- SIP integrations
- browser speech APIs

Avoid:
- uncontrolled autonomous execution
- direct production tool execution
- hardcoded realtime credentials

---

# Risk Classification

| Area | Risk |
|---|---|
| Voice UI | MEDIUM |
| Session orchestration | HIGH |
| Realtime streaming | HIGH |
| Operational guidance | HIGH |
| Driver hands-free workflows | HIGH |
| Production voice routing | CRITICAL |
| Autonomous operational execution | CRITICAL |

---

# Core Principles

## Realtime-first architecture

Voice agents must prioritize:

- low latency
- interruption handling
- streaming resilience
- session continuity
- graceful fallback behavior

Avoid blocking workflows.

---

## Human escalation

Voice agents must support escalation to:

- human support
- dispatcher
- account manager
- operations team

Never trap users inside AI-only loops.

---

## Context-aware conversations

Voice agents should leverage:

- user role
- active operational state
- landing/session context
- CRM lead data
- Firebase operational data
- previous interactions

Avoid generic assistant behavior.

---

# Factory Allowed Scope

Factory MAY:

- generate voice UI
- generate transcript UI
- generate session state machines
- generate mock voice adapters
- generate Firebase persistence helpers
- generate conversation reducers
- generate voice onboarding flows
- generate realtime session schemas
- generate fallback text-chat UI

Factory MAY NOT:

- expose production keys
- deploy live realtime infrastructure
- configure production WebRTC
- configure production SIP routing
- deploy production phone integrations
- bypass escalation flows

---

# Claude Code Escalation Rules

Claude Code required for:

- ElevenLabs production integration
- realtime orchestration
- WebRTC configuration
- audio streaming debugging
- voice latency optimization
- browser audio permission debugging
- Twilio/SIP integrations
- production deployment
- AI orchestration review

---

# Human Approval Required

Human approval required for:

- production launch
- customer-facing scripts
- compliance-sensitive messaging
- investor-facing statements
- outbound voice automation
- recording/privacy rules
- escalation policies

---

# Recommended Architecture

## Frontend

Preferred:
- React/Vite
- React Native
- realtime session hooks
- transcript rendering
- interruption-aware UI
- state-driven audio controls

---

## Backend

Preferred:
- Firebase Functions
- orchestration services
- realtime session management
- token generation services
- AI routing adapters

---

## Persistence

Preferred:
- Firestore session docs
- transcript persistence
- escalation tracking
- lead qualification persistence
- AI interaction summaries

Avoid:
- oversized raw audio storage
- unbounded transcript growth

---

# Session Lifecycle

Voice flows should explicitly define:

- session start
- greeting
- context loading
- interruption handling
- escalation handling
- transcript persistence
- fallback behavior
- session completion

Avoid hidden session transitions.

---

# Prompt Rules

Voice prompts should:

- define persona clearly
- define escalation rules
- define operational boundaries
- support interruptions
- support short conversational turns
- avoid long monologues

Prompts must avoid:
- legal guarantees
- unsupported claims
- operational certainty assumptions
- unsafe driving guidance

---

# Driver Safety Rules

Driver voice assistants must:

- minimize distraction
- prioritize concise responses
- avoid requiring visual interaction while driving
- support interruption handling
- support reconnect behavior

Voice agents must NOT:
- encourage unsafe driving behavior
- provide legal/safety guarantees
- override operational safety rules

---

# Testing Rules

Factory may test:

- session reducers
- transcript state
- interruption handling
- payload builders
- fallback behavior
- transcript persistence helpers
- lead qualification state

Factory must NOT test:

- real audio streaming
- production realtime sessions
- live phone routing
- production voice APIs
- actual browser microphone behavior

Use mocked voice adapters.

---

# Validation Commands

```bash
npm run build
./node_modules/.bin/tsc --noEmit
```

If test suite exists:

```bash
npm run test -- --run
```

---

# Acceptance Criteria Expectations

Every voice feature should define:

- target audience
- escalation path
- fallback behavior
- interruption behavior
- transcript persistence
- latency expectations
- reconnect behavior
- privacy/disclaimer requirements

---

---

## Default Building Blocks

These building blocks are always loaded for every voice-agent-elevenlabs-feature plan:

| Building Block | Why Required |
|----------------|-------------|
| `voice-session-lifecycle` | Defines the complete audio recording lifecycle (expo-av): permissions, Audio mode config, Recording useRef pattern, start/stop/send flow, state machine. |
| `AI-session-orchestration` | Voice sessions persist turns to Firestore subcollections, not array fields. Defines saveInvestorTurn model, finalizeSession, and context hydration with status gate. |
| `testing-guide` | Voice tests use mocked audio adapters. Factory never tests real audio streaming, production voice APIs, or live phone routing. |

## Optional Building Blocks

Include when the feature plan declares the matching need:

| Building Block | When to Include |
|----------------|----------------|
| `AI-workflow-pipeline` | Voice session uses post-session structured extraction (Chat Completions + json_object for transcript analysis). |
| `assistant-session-persistence` | Voice agent requires thread-channel binding (Assistants API) or turn-by-turn subcollection persistence. |
| `callable-function-pattern` | Backend Cloud Function generates ElevenLabs tokens, manages session state, or processes voice data server-side. |
| `cloud-function-structure` | Cloud Function follows LogiTruck import conventions and index.js export pattern. |
| `loading-empty-error-state` | Voice UI has three states: idle, recording/connecting, error/disconnected. |

## Execution Defaults

| Property | Value |
|----------|-------|
| `executionLevelDefault` | `L2` — Claude Code integration required |
| `riskLevelDefault` | `high` |
| `factoryCanAutoRetry` | `true` for voice UI shell and session reducers only |
| `requiresClaudeCodeReview` | mandatory — realtime infrastructure, audio permissions, latency |
| `validationCommands` | `npm run build`, `tsc --noEmit` |

## Escalation Rules

| Condition | Escalation |
|-----------|-----------|
| Factory generates voice UI shell and transcript display | L1 — factory can generate |
| Factory generates session state machines and mock adapters | L1 — factory can generate |
| ElevenLabs production integration | L2 — Claude Code required |
| WebRTC or audio streaming configuration | L2 — Claude Code required |
| Production launch of voice features | L3 — human approval required |
| Customer-facing voice scripts or personas | L3 — human approval required |
| Investor-facing voice statements | L3 — human approval required |
| Outbound voice automation | L3 — human approval required |
| Factory cannot expose production voice API keys | L4 — prohibited |
| Factory cannot configure production WebRTC or phone routing | L4 — prohibited |

---

# Future Extensions

Potential future archetype expansions:

- investor-voice-agent-feature
- driver-voice-copilot-feature
- realtime-dispatch-voice-feature
- inbound-support-voice-feature
- outbound-qualification-voice-feature
- multilingual-voice-agent-feature
