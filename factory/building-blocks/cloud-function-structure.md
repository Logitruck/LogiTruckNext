# Building Block: Cloud Function Structure

## Purpose

Documents the structural conventions used across all Cloud Functions v2 in `functions/` (the Cloud Functions root), covering import patterns, function types, configuration options, logging conventions, error handling, and the `index.js` export registry. Every generated or modified function must follow these patterns to be compatible with Firebase deployment.

---

## Operational Problem Solved

Inconsistent function structure causes runtime failures, cold-start delays, and deployment errors. This block establishes a single canonical structure that every function type follows, eliminating structural drift and ensuring predictable behaviour across all environments.

---

## Real Examples from Codebase

| File | Function types used |
|---|---|
| `functions/triggers/distributeRequest/distributeRequest.js` | `onDocumentCreated` |
| `functions/triggers/deels/onRequestUpdated.js` | `onDocumentUpdated` |
| `functions/triggers/deels/onVendorRequestUpdated.js` | `onDocumentUpdated` |
| `functions/triggers/projects/onSetupFlagWritten.js` | `onDocumentWritten` |
| `functions/landing/saveInvestorTurn.js` | `onRequest` |
| `functions/app/jobs/assignCarrierProjectJob.js` | `onCall` |
| `functions/app/tickets/processJobTicket.js` | `onCall` with `timeoutSeconds` |
| `functions/app/chat/chatv2.js` | `onCall` + `onDocumentCreated` |

---

## Canonical Import Block

```js
// v2 HTTP functions
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');

// v2 Firestore triggers
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require('firebase-functions/v2/firestore');

// v2 Scheduler
const { onSchedule } = require('firebase-functions/v2/scheduler');

// Logger
const { logger } = require('firebase-functions');

// Admin SDK
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Firestore client — module-level singleton
const db = getFirestore();
```

`admin.initializeApp()` is called once in `index.js`, not in individual function files. Function files call `getFirestore()` or `admin.firestore()` and receive the already-initialized instance.

---

## Function Type Reference

### onCall — authenticated callable

```js
// Used in: functions/app/jobs/assignCarrierProjectJob.js, functions/app/tickets/processJobTicket.js
exports.myCallable = onCall(async (request) => {
  const authUID = request.auth?.uid;
  if (!authUID) throw new HttpsError('unauthenticated', 'Auth required');
  const { field1, field2 } = request.data;
  // ...
  return { success: true };
});
```

With timeout override (for AI-heavy functions):
```js
exports.processJobTicket = onCall(
  { timeoutSeconds: 120, region: ['us-central1'] },
  async (req) => { ... }
);
```

### onRequest — HTTP endpoint

```js
// Used in: functions/landing/saveInvestorTurn.js, functions/landing/finalizeInvestorSession.js
exports.myEndpoint = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const { field } = req.body;
  // ...
  return res.status(200).json({ ok: true });
});
```

### onDocumentCreated

```js
// Used in: functions/triggers/distributeRequest/distributeRequest.js, functions/triggers/inspections/inspections.js
exports.onEntityCreated = onDocumentCreated(
  'collection/{entityID}',
  async (event) => {
    const { entityID } = event.params;
    const data = event.data?.data();
    if (!data) return;
    // ...
  }
);
```

### onDocumentUpdated

```js
// Used in: functions/triggers/deels/onRequestUpdated.js, functions/triggers/deels/onVendorRequestUpdated.js
exports.onEntityUpdated = onDocumentUpdated(
  'collection/{entityID}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    // ...
  }
);
```

### onDocumentWritten (create + update + delete)

```js
// Used in: functions/triggers/projects/onSetupFlagWritten.js
exports.onFlagWritten = onDocumentWritten(
  'parent/{parentID}/flags/{role}',
  async (event) => {
    const after = event.data?.after?.data();
    if (!after?.done) return;  // guard on field value
    // ...
  }
);
```

### onSchedule — cron job

```js
// Pattern reference — no onSchedule functions in current functions/ repo; resetVehicleStatusDaily.js is legacy-removed
const resetVehicleOperationalStatusDaily = onSchedule(
  {
    schedule: '0 4 * * *',  // 4am daily
    timeZone: 'America/New_York',
    region: 'us-central1',
  },
  async () => {
    logger.info('Starting daily job');
    // batch-per-vendor pattern
  }
);
module.exports = { resetVehicleOperationalStatusDaily };
```

---

## Global Options

Set once per file for functions that share region/scaling config:

```js
// Pattern reference — stripeconnect.js is legacy-removed; use this when multiple functions in the same file share region config
const { setGlobalOptions } = require('firebase-functions/v2/options');
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });
```

Individual function overrides take precedence over `setGlobalOptions`.

---

## index.js Export Registry Pattern

```js
// functions/index.js
const admin = require('firebase-admin');
admin.initializeApp();

// Module require + export on same line (compact form)
exports.assignCarrierProjectJob = require('./jobs/assignCarrierProjectJob').assignCarrierProjectJob;
exports.onRequestCreated = require('./distributeRequest/distributeRequest').onRequestCreated;

// Module + multiple exports (expanded form)
const chat = require('./chat/chatv2');
exports.createChannel = chat.createChannel;
exports.insertMessage = chat.insertMessage;
```

`/* INSERT_FIREBASE_FUNCTION */` comment at the bottom of `index.js` marks the injection point for factory-generated exports.

---

## Logging Conventions

```js
logger.info(`📡 Processing request ${id}`);
logger.warn(`⚠️ Missing field: ${fieldName}`);
logger.error(`❌ Failed to process ${id}:`, error);
logger.info(`✅ Completed processing ${id}`);
```

Emoji prefixes used consistently: `📡` data events, `📦` query results, `✅` success, `❌` error, `⚠️` warn, `🚫` skip/guard, `🔍` lookup, `📌` detection, `🚀` major events.

---

## Error Handling Pattern

**For `onCall`**: throw `HttpsError` — never plain `Error`  
**For `onRequest`**: return `res.status(N).json({ ok: false, error: message })`  
**For triggers**: try/catch per branch, log error, do not rethrow

```js
// Trigger error pattern
try {
  await processWork();
} catch (error) {
  logger.error(`❌ Error processing ${id}:`, error);
  // Do NOT rethrow — triggers do not benefit from rethrowing in v2
}
```

---

## Current Backend Risks

| Risk | Location | Severity |
|---|---|---|
| Hardcoded OpenAI API keys | `functions/app/openai/openai.js`, `functions/app/tickets/processJobTicket.js`, `functions/landing/finalizeInvestorSession.js` | **Critical** |
| Hardcoded FCM server key | `functions/notifications/utils.js` line 131 | **Critical** |
| Sequential vendor loop in Firestore trigger | `functions/triggers/distributeRequest/distributeRequest.js` — iterates ALL vendors synchronously inside trigger | **High** |

All API keys must move to `process.env` (via `.env.local` or Firebase Secret Manager) before production deployment.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `admin.initializeApp()` inside a function file | Already initialized in index.js; causes duplicate app error |
| `throw new Error(...)` inside `onCall` | Client gets opaque INTERNAL; use `HttpsError` with typed code |
| Rethrowing from a Firestore trigger handler | Marks function failed; Firestore triggers do not retry in v2 |
| `data.auth` pattern (v1 callable) | `data.auth` is undefined in v2; use `request.auth` |
| Hardcoded collection names in function files | All paths must come from a shared constants file |

---

## Validation Commands

```bash
# Verify no admin.initializeApp() in function files (only in index.js)
grep -r "admin.initializeApp()" functions --include="*.js" | grep -v index.js | grep -v node_modules

# Find all hardcoded API keys
grep -r "sk-\|sk_test_\|key=" functions --include="*.js" | grep -v node_modules | grep -v ".env"

# Verify all onCall functions use request.auth not data.auth
grep -r "data\.auth" functions --include="*.js" | grep -v node_modules
```

---

## Factory Governance

- Factory generates all function files into `/tmp` clone only
- Every function file follows the import block above exactly
- API keys come from `process.env.VARIABLE_NAME` only — never hardcoded
- Export added to `index.js` at the `/* INSERT_FIREBASE_FUNCTION */` marker
- Claude Code reviews, removes any hardcoded credentials, and deploys
