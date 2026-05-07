# Native Integration Feature Archetype

## Archetype Name

native-integration-feature

---

# Purpose

This archetype governs all native mobile integration work across the LogiTruck ecosystem.

This includes native SDK installation planning, Expo plugin impact analysis, iOS and Android native configuration planning, Pods / Gradle change planning, background services, push notification native setup, map provider native setup, camera/document native modules, realtime voice/audio native integrations, and build/runtime configuration analysis.

This archetype is classified as CRITICAL risk.

---

# Production Integration Rule

Factory execution never directly modifies the real production repository.

The factory works only in temporary clones, isolated branches, sandbox workspaces, or staging repositories.

Factory output is considered an integration candidate only.

Claude Code is always responsible for reviewing generated changes, integrating into the real repository, validating runtime behavior, validating architecture compatibility, validating simulator/device behavior when applicable, and committing final production-safe changes.

---

# Core Principle

For native integrations, the factory produces a handoff package and safe implementation candidates.

Claude Code owns final integration into the real LogiTruck repository.

---

# Factory Allowed Scope

Factory MAY generate, in sandbox only:

- implementation plans
- dependency impact summaries
- native risk checklists
- TypeScript service drafts
- mock service layers
- isolated UI components
- testable JS helpers
- validation checklists
- Claude Code handoff instructions

Factory MAY NOT install native dependencies in the production repo, run pod install against production repo, modify Gradle in production repo, modify Xcode project settings, modify app.json plugins in production repo, run Expo prebuild against production repo, debug production native runtime issues, or deploy native builds.

---

# Claude Code Responsibilities

Claude Code owns dependency installation, Expo plugin setup, app.json plugin configuration, Pod install, Gradle changes, EAS compatibility validation, simulator/device debugging, native runtime debugging, build validation, production integration review, and final commit into the real repository.

---

# Human Approval Required

Human approval required for production rollout, privacy-sensitive permissions, location/tracking permissions, microphone permissions, camera permissions, operationally sensitive native behavior, and user-facing permission copy.

---

# Supported Native Domains

## Maps

Examples:

- Mapbox
- react-native-maps
- background location
- route rendering engines

Requires permission review, battery review, runtime validation, and simulator/device validation.

## Voice

Examples:

- ElevenLabs realtime
- microphone access
- WebRTC
- audio routing

Requires realtime testing, interruption handling, permission handling, and latency validation.

## Camera / Documents

Examples:

- document scanning
- ID verification
- image upload
- inspection capture

Requires permission handling, storage review, upload validation, and device validation.

## Push Notifications

Examples:

- Firebase messaging
- operational notifications
- deep links

Requires iOS/APNs validation, Android runtime validation, and background behavior review.

---

# Preferred Integration Pattern

```txt
Factory sandbox
  -> generate plan + safe JS candidates + tests
  -> produce handoff package
  -> Claude Code reviews and integrates
  -> Claude Code validates native runtime
  -> Claude Code commits to production repo
```

Avoid direct production mutation by factory, screens directly coupled to native SDK details, and native behavior spread across unrelated files.

---

# Protected Areas

Protected files require Claude Code review:

```txt
app.json
ios/
android/
plugins/
Podfile
build.gradle
eas.json
babel.config.js
metro.config.js
```

---

# Testing Rules

Factory may test JS service candidates, permission state logic, payload builders, fallback reducers, mock integrations, and TypeScript types.

Factory must NOT test native runtime, real microphone, real GPS, native camera, production builds, or simulator/device behavior.

Use mocks/adapters only.

---

# Acceptance Criteria Expectations

Every native integration feature should define:

- native dependency
- supported platforms
- required permissions
- fallback behavior
- runtime expectations
- testing expectations
- rollback strategy
- Claude Code integration tasks
- human approval requirements

---

# Future Extensions

Potential future archetype expansions:

- mapbox-native-feature
- realtime-audio-feature
- push-notification-feature
- document-scanner-feature
- background-tracking-feature
- native-payment-terminal-feature
