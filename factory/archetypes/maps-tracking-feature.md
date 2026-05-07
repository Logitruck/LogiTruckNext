# Maps & Tracking Feature Archetype

## Archetype Name

maps-tracking-feature

---

# Purpose

This archetype governs all features related to:

- realtime tracking
- driver location
- route rendering
- map providers
- ETA calculations
- route deviation
- geofencing
- trip progression
- pickup/dropoff navigation
- route summaries
- polyline handling

This is considered a HIGH-RISK feature archetype due to native dependencies, realtime synchronization, battery impact, and operational sensitivity.

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

# Supported Providers

Current approved providers:

- HERE Maps
- Mapbox (future)
- Google Maps (legacy support only if already present)

---

# Core Architectural Rules

## Realtime-first

Tracking must prioritize realtime operational visibility while minimizing:

- Firestore write amplification
- battery drain
- GPS overuse
- unnecessary rerenders
- unnecessary listeners

---

## Event-driven progression

Trip states should evolve through explicit operational events:

Examples:

- assigned
- scheduled
- arrived_at_pickup
- loaded
- en_route_to_dropoff
- arrived_at_dropoff
- completed

Avoid implicit status assumptions.

---

## JS isolation preferred

Factory should isolate:

- route calculations
- ETA formatting
- state transitions
- distance calculations
- polyline parsing

Native integrations must remain minimal and centralized.

---

# Risk Classification

| Area | Risk |
|---|---|
| Route formatting | LOW |
| ETA calculations | LOW |
| Polyline parsing | LOW |
| Tracking hooks | MEDIUM |
| Firestore location sync | MEDIUM |
| Map screens | HIGH |
| Background tracking | HIGH |
| Native map providers | CRITICAL |
| Expo plugin changes | CRITICAL |

---

# Factory Allowed Scope

Factory MAY:

- generate map UI components
- generate tracking hooks
- generate route helper utilities
- generate ETA helpers
- generate Firestore sync helpers
- generate tracking reducers
- generate unit tests
- generate mock GPS utilities

Factory MAY NOT:

- install native map libraries
- modify Expo plugins
- modify iOS permissions
- modify Android permissions
- modify app.json
- run Expo prebuild
- install pods
- validate native runtime behavior

Those require Claude Code escalation.

---

# Native Escalation Rules

Claude Code required for:

- Mapbox installation
- react-native-maps installation changes
- Expo config plugins
- background location permissions
- iOS location capability changes
- Android foreground/background location config
- Hermes runtime issues
- pod install
- Gradle modifications

---

# Current LogiTruck Patterns

## Route source

Preferred:

- HERE Routing API
- encodedPolyline
- @liberty-rider/flexpolyline

---

## Route rendering

Preferred:

- MapView
- Marker
- Polyline

---

## Tracking architecture

Preferred:

- location watcher hook
- throttled Firestore sync
- role-aware tracking
- trip-state-driven rendering

---

## Distance calculations

Preferred:

- haversine
- normalized meters internally

Avoid mixing:
- miles
- kilometers
- meters
without normalization.

---

# Firestore Rules

Tracking writes must:

- throttle updates
- avoid duplicate writes
- avoid write storms
- support offline transitions

Preferred sync targets:

- jobs
- vehicles
- tracking collections
- project channels

---

# Testing Rules

Factory may test:

- ETA formatting
- polyline decoding
- deviation calculations
- state transitions
- route selection logic
- distance helpers
- throttling logic

Factory must NOT test:

- native GPS
- real location services
- actual map rendering
- simulator/device runtime behavior
- native background execution

---

# Validation Commands

```bash
./node_modules/.bin/jest src/**/__tests__ --watchAll=false --forceExit
./node_modules/.bin/tsc --noEmit
```

---

# Protected Areas

Protected files require Claude Code review:

- HomeTrackingScreen
- Driver navigation root
- app.json
- Expo plugins
- location permission handlers

---

# Recommended File Patterns

## Hooks

```txt
src/hooks/useRouteToDestination.ts
src/hooks/useSyncDriverLocation.ts
src/hooks/useTripProgress.ts
```

## Components

```txt
src/components/maps/
src/components/tracking/
```

## Services

```txt
src/services/maps/
src/services/tracking/
```

---

# Acceptance Criteria Expectations

Every maps/tracking feature should define:

- operational state transitions
- failure behavior
- offline behavior
- permission handling
- throttling behavior
- ETA expectations
- Firestore synchronization behavior

---

---

## Default Building Blocks

These building blocks are always loaded for every maps-tracking-feature plan:

| Building Block | Why Required |
|----------------|-------------|
| `screen-hook-separation` | Map screens must never call Firestore directly. Location data flows through dedicated hooks. |
| `hook-service-pattern` | Location and tracking hooks follow the three-layer pattern with cleanup contract. |
| `realtime-firestore-listener` | Tracking features require real-time Firestore sync for driver position updates. |
| `loading-empty-error-state` | Map screens must handle loading (GPS acquiring), empty (no route), and error (location denied) states. |
| `testing-guide` | Factory tests JS logic only: ETA formatting, polyline parsing, deviation detection. Never native GPS or real map rendering. |

## Optional Building Blocks

Include when the feature plan declares the matching need:

| Building Block | When to Include |
|----------------|----------------|
| `async-lookup-then-subscribe` | Tracking hook requires vendorID/vehicleID lookup before subscribing to location collection. |
| `trip-status-machine` | Feature involves trip status transitions (assigned → loaded → en_route → completed). |
| `route-rendering-pattern` | Feature adds a new screen to the Driver or Carrier navigator. |
| `idempotent-event-processing` | Feature writes location updates that must avoid duplicate writes (throttling, dedup). |

## Execution Defaults

| Property | Value |
|----------|-------|
| `executionLevelDefault` | `L2` — Claude Code integration required |
| `riskLevelDefault` | `high` |
| `factoryCanAutoRetry` | `true` for pure JS (ETA, polyline, deviation); `false` for screen integration |
| `requiresClaudeCodeReview` | yes — native compatibility, location permissions, simulator validation |
| `validationCommands` | `jest`, `tsc --noEmit` (JS only; no native runtime testing) |

## Escalation Rules

| Condition | Escalation |
|-----------|-----------|
| Feature is pure JS: ETA formatting, polyline parsing, distance calc | L1 — factory can generate |
| Feature requires location hook or tracking reducer | L2 — Claude Code integration |
| Feature requires Firestore location sync | L2 — Claude Code integration |
| Feature requires native map SDK installation | L3 — Claude Code + human approval |
| Feature modifies iOS/Android location permissions | L3 — human approval |
| Feature requires Expo plugin changes or expo prebuild | L4 — prohibited for factory |

---

# Future Extensions

Potential future archetype expansions:

- geofencing-feature
- fleet-live-monitoring-feature
- mapbox-migration-feature
- AI-route-optimization-feature
- dispatch-command-center-feature
