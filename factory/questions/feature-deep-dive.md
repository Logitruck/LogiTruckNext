# Feature Deep Dive Questions

## Purpose

Capture advanced technical and operational requirements before factory execution.

This phase happens AFTER feature intake.

Only ask questions relevant to the detected archetypes and building blocks.

---

# Maps / Tracking

Ask when:
- realtime tracking
- route rendering
- driver location
- ETA
- geofencing

Questions:
- Which provider is used? (HERE / Mapbox / Google)
- Is background tracking required?
- Does the route require recalculation?
- What triggers status transitions?
- Is battery optimization important?
- Is simulator validation required?

---

# Firestore / Realtime

Ask when:
- listeners
- subscriptions
- operational dashboards
- realtime UI

Questions:
- Which collections are source of truth?
- Is realtime required or polling acceptable?
- Can listeners scale horizontally?
- What cleanup lifecycle is expected?
- Are multiple listeners coordinated?

---

# Cloud Functions

Ask when:
- backend orchestration
- AI pipelines
- event-driven flows
- retries

Questions:
- Is idempotency required?
- Is retry safe?
- Is this trigger-based or callable?
- Is Cloud Tasks needed?
- Are there transaction boundaries?

---

# AI / Voice

Ask when:
- AI orchestration
- realtime voice
- GPT workflows
- ElevenLabs

Questions:
- Is session persistence required?
- Is escalation required?
- Is transcript storage required?
- Are operational boundaries defined?
- What happens on provider failure?

---

# Payments / Stripe

Ask when:
- Stripe
- payouts
- payment intents
- commissions

Questions:
- Is this marketplace money flow?
- Is Connect involved?
- Are refunds required?
- Is payout timing important?
- Are investor returns involved?

---

# Landings / Growth

Ask when:
- React Vite
- lead capture
- GHL
- AI landing

Questions:
- Is this public-facing?
- Is SEO required?
- Is voice onboarding required?
- Does this connect to CRM?
- What lead fields are required?

---

# Native Integrations

Ask when:
- Mapbox
- push notifications
- microphone
- camera
- background location

Questions:
- Is Expo plugin setup required?
- Are new permissions required?
- Is device testing required?
- Is EAS build required?

---

# Operational Safety Questions

Ask when feature impacts operations:

- What breaks if this fails?
- Is rollback required?
- Is partial failure acceptable?
- Is realtime consistency required?
- Is human escalation required?

---

# Output Requirement

Claude Architect must enrich the implementation plan with:

- deep technical risks
- escalation boundaries
- simulator/device requirements
- retry/idempotency expectations
- rollback strategy
- operational safeguards

Do not generate runtime code during deep dive.
