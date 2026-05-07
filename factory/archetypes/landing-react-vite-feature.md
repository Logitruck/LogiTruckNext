# Landing React Vite Feature Archetype

## Archetype Name

landing-react-vite-feature

---

# Purpose

This archetype governs all features related to LogiTruck web landing projects built with React and Vite, including:

- investor landing pages
- shipper landing pages
- carrier landing pages
- AI voice landing experiences
- lead capture pages
- campaign-specific landing pages
- conversion-focused funnels
- embedded CRM forms
- AI-assisted storytelling flows

This is a MEDIUM-RISK archetype by default, but it can become HIGH-RISK when connected to AI voice, payments, CRM automation, or production lead pipelines.

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

Landings are not simple marketing pages.

In LogiTruck, landings are part of the growth and investor acquisition infrastructure.

They may:

- explain the business model
- capture leads
- qualify prospects
- host AI voice agents
- persist conversation data
- trigger CRM workflows
- generate investor/customer briefing data
- connect with Firebase, GHL, n8n, or AI orchestration flows

---

# Approved Stack

Preferred:

- React
- Vite
- TypeScript
- Firebase client SDK where needed
- CSS modules or simple scoped CSS
- lightweight component architecture

Optional:

- Tailwind only if already configured
- Framer Motion only if needed for conversion/storytelling
- Web Speech / WebRTC / realtime APIs only with explicit plan

Avoid:

- unnecessary SSR
- heavy frameworks
- unnecessary global state
- storing secrets in frontend code

---

# Risk Classification

| Area | Risk |
|---|---|
| Static UI sections | LOW |
| Lead capture form | MEDIUM |
| Firebase persistence | MEDIUM |
| CRM/webhook integration | HIGH |
| AI voice integration | HIGH |
| Investor claims/copy | HIGH |
| Production secrets | CRITICAL |

---

# Factory Allowed Scope

Factory MAY:

- create landing sections
- create React components
- create conversion-focused layouts
- create lead capture UI
- create local state flows
- create Firebase client helpers
- create mock AI session components
- create TypeScript types
- create tests for pure helpers
- create prompt/copy drafts clearly marked as draft

Factory MAY NOT:

- expose API keys
- hardcode secrets
- make legal/investment claims as facts
- deploy production landings
- connect production CRM without approval
- make live AI/voice calls without explicit configuration
- modify DNS or hosting settings

---

# Claude Code Escalation Rules

Claude Code required for:

- production deployment
- environment variable configuration
- Firebase Hosting setup
- Vercel/Netlify setup
- GHL webhook integration
- production AI voice integration
- realtime session debugging
- cross-origin / CORS issues
- analytics setup
- production lead flow validation

---

# Human Approval Required

Human approval required for:

- investor-facing claims
- financial projections
- fundraising language
- legal disclaimers
- data privacy language
- production campaign launch
- CRM automations that contact real leads

---

# Recommended Directory Pattern

For each landing project:

```txt
apps/web/<landing-name>/
├── src/
│   ├── components/
│   ├── sections/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

# Component Pattern

Prefer section-based architecture:

```txt
sections/
├── HeroSection.tsx
├── ProblemSection.tsx
├── SolutionSection.tsx
├── MarketSection.tsx
├── BusinessModelSection.tsx
├── AILeverageSection.tsx
├── CTASection.tsx
└── FooterSection.tsx
```

Use small components for:

- buttons
- cards
- badges
- form fields
- status indicators
- AI message bubbles
- voice controls

---

# AI Voice Landing Rules

When a landing includes an AI voice agent:

Factory MAY generate:

- UI shell
- session state machine
- transcript display
- mock voice adapter
- Firebase persistence helpers
- prompt templates
- fallback text chat UI

Factory MUST NOT directly wire production realtime voice without Claude Code review.

Required planning fields:

- voice provider
- session lifecycle
- fallback behavior
- transcript persistence
- lead qualification fields
- escalation path
- privacy notice

---

# Firebase Rules

Frontend Firebase usage must:

- use public client config only
- write only to approved collections
- avoid privileged operations
- never expose admin credentials
- validate payload shape before write

Sensitive operations must go through Cloud Functions.

---

# CRM / GHL Rules

Factory may prepare:

- webhook payload builders
- mock webhook clients
- lead qualification schema
- CRM mapping docs

Claude Code/human approval required for:

- live webhook URLs
- production automations
- email/SMS triggers
- lead routing logic

---

# Testing Rules

Factory may test:

- form validation
- payload builders
- section rendering
- state transitions
- helper utilities
- Firebase payload shape
- AI session reducer logic

Factory should not test:

- real CRM calls
- real AI calls
- production analytics
- third-party dashboard behavior

---

# Validation Commands

For React/Vite landing projects:

```bash
npm install
npm run build
npm run test -- --run
```

If no test suite exists:

```bash
npm run build
```

is the minimum validation.

---

# Copywriting Rules

Investor or customer-facing copy must be marked as:

- draft
- subject to founder approval
- not legal/financial advice
- not guaranteed performance claims

Avoid unsupported claims such as:

- guaranteed returns
- guaranteed savings
- guaranteed delivery performance
- guaranteed AI accuracy

---

# Acceptance Criteria Expectations

Every landing feature should define:

- target audience
- conversion goal
- primary CTA
- lead capture fields
- integration targets
- tracking/analytics requirements
- privacy/disclaimer needs
- deployment target

---

---

## Default Building Blocks

These building blocks are always loaded for every landing-react-vite-feature plan:

| Building Block | Why Required |
|----------------|-------------|
| `loading-empty-error-state` | Landing pages with Firebase persistence or AI integration must handle loading, empty, and error states. Lead capture forms must show feedback states. |
| `testing-guide` | Landing tests cover form validation, payload builders, section rendering, and pure helpers. Never test real CRM calls or live AI APIs. |

## Optional Building Blocks

Include when the feature plan declares the matching need:

| Building Block | When to Include |
|----------------|----------------|
| `AI-session-orchestration` | Landing includes an AI voice or chat agent with turn-by-turn Firestore persistence. |
| `AI-workflow-pipeline` | Landing uses post-session analysis (transcript → GPT-4o → structured lead qualification data). |
| `voice-session-lifecycle` | Landing includes a voice recorder component or ElevenLabs voice agent UI. |
| `assistant-session-persistence` | Landing persists AI conversation turns to Firestore for CRM analysis or lead qualification. |
| `idempotent-event-processing` | Landing creates Firestore documents (lead records, session records) that must not be duplicated on retry. |

## Execution Defaults

| Property | Value |
|----------|-------|
| `executionLevelDefault` | `L1` — factory + Claude Code review |
| `riskLevelDefault` | `medium` (escalates to high when AI voice or CRM is connected) |
| `factoryCanAutoRetry` | `true` for static sections, lead capture UI, component generation |
| `requiresClaudeCodeReview` | yes — environment config, Firebase rules, CRM integration |
| `validationCommands` | `npm run build`, `npm run test -- --run` |

## Escalation Rules

| Condition | Escalation |
|-----------|-----------|
| Factory generates static sections and React components | L1 — factory can generate |
| Factory generates lead capture UI and Firebase helpers | L1 — factory can generate |
| Production deployment (Firebase Hosting, Vercel, Netlify) | L2 — Claude Code required |
| GHL webhook integration | L2 — Claude Code required |
| Production AI voice integration | L2 — Claude Code required |
| Investor-facing claims or financial projections | L3 — human approval required |
| Legal disclaimers or fundraising language | L3 — human approval required |
| Production CRM automations that contact real leads | L3 — human approval required |
| Factory cannot expose API keys in frontend code | L4 — prohibited |
| Factory cannot modify DNS or hosting infrastructure | L4 — prohibited |

---

# Future Extensions

Potential future archetype expansions:

- investor-landing-feature
- shipper-landing-feature
- carrier-landing-feature
- ai-voice-landing-feature
- ghl-campaign-landing-feature
- referral-landing-feature
