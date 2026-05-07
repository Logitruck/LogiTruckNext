# Building Block: AI Session Orchestration

## Pattern Summary

AI conversations in LogiTruck are persisted turn-by-turn to Firestore, then analysed server-side by a separate Cloud Function after the session ends. The client sends each turn to a `saveInvestorTurn` endpoint as the conversation progresses. When done, it calls `finalizeInvestorSession` which reads all turns, runs a GPT-4o analysis, and writes structured results back to Firestore. Context documents are fetched once at session start from a curated `logitruck_public_context` collection.

---

## Problem Being Solved

AI sessions require: (1) durable conversation history that survives client reconnects, (2) a separation between the fast turn-by-turn flow and the slow post-session analysis, (3) structured data extraction from unstructured dialogue, (4) an audit trail of every turn for CRM and analytics.

---

## Where This Pattern Appears in the Codebase

| File | Role |
|---|---|
| `LogiFunctionsV2/functions/landing/saveInvestorTurn.js` | `onRequest` POST — persists one turn to Firestore |
| `LogiFunctionsV2/functions/landing/finalizeInvestorSession.js` | `onRequest` POST — reads all turns, runs GPT-4o, writes analysis |
| `LogiFunctionsV2/functions/openai/investorContext.js` | `onRequest` GET/POST — reads curated context document |
| `LogiFunctionsV2/functions/openai/marketStudy.js` | `onRequest` — similar pattern for market study context |
| `LogiFunctionsV2/functions/openai/openai.js` | Orphaned `chatAssistant` — Assistants API polling loop (not used in production) |

---

## Session Lifecycle

```
Client session start
  → GET /getLogiTruckInvestorContext → fetch curated context document
      → status guard: document.status must = 'approved'
      → inject context into AI system prompt

  → AI conversation loop (N turns):
      User types → POST /saveLogiTruckInvestorTurn { sessionId, role: 'user', text }
      AI responds → POST /saveLogiTruckInvestorTurn { sessionId, role: 'assistant', text }

  → Session ends:
      POST /finalizeInvestorSession { sessionId }
        → Read all turns ordered by clientTimestamp
        → Build dialogue string
        → POST to GPT-4o with structured JSON schema
        → Write analysis to sessions/{sessionId}/analysis/{id}
        → Set sessions/{sessionId}.hasAnalysis = true
```

---

## saveInvestorTurn — Turn Persistence

```js
// LogiFunctionsV2/functions/landing/saveInvestorTurn.js
exports.saveLogiTruckInvestorTurn = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { sessionId, role, text, source = 'logitruck-investor-landing', timestamp } = req.body;

  if (!sessionId || !role || !text) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  const sessionRef = db.collection('logitruck_investor_agent_sessions').doc(sessionId);

  // Upsert session document
  await sessionRef.set({
    id: sessionId,
    source,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Append turn as subcollection document
  await sessionRef.collection('turns').add({
    role,         // 'user' | 'assistant'
    text,
    source,
    clientTimestamp: timestamp || Date.now(),
    createdAt: FieldValue.serverTimestamp(),
  });

  return res.status(200).json({ ok: true, sessionId });
});
```

**Design decisions:**
- Session document is upserted with `merge: true` — safe to call on every turn
- Turn is stored in a `turns` subcollection, not as an array field — allows ordered queries and unlimited turns
- `clientTimestamp` is separate from `createdAt` — client supplies its own timestamp for ordering, which is stable across offline scenarios; `createdAt` is server-authoritative for audit

---

## finalizeInvestorSession — Post-session Analysis

```js
// LogiFunctionsV2/functions/landing/finalizeInvestorSession.js
exports.finalizeInvestorSession = onRequest(
  { cors: true, timeoutSeconds: 120 },
  async (req, res) => {
    const { sessionId } = req.body;

    // 1. Read all turns ordered by clientTimestamp
    const turnsSnap = await db
      .collection('logitruck_investor_agent_sessions')
      .doc(sessionId)
      .collection('turns')
      .orderBy('clientTimestamp', 'asc')
      .get();

    if (turnsSnap.empty) return res.status(404).json({ ok: false });

    // 2. Build dialogue string
    const dialogue = turnsSnap.docs
      .map(doc => {
        const { role, text } = doc.data();
        return `${role === 'assistant' ? 'Agent' : 'User'}: ${text}`;
      })
      .join('\n');

    // 3. GPT-4o structured extraction
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this investor briefing conversation:\n\n${dialogue}` },
      ],
      response_format: { type: 'json_object' },
    });

    const analysisData = JSON.parse(completion.choices[0].message.content);

    // 4. Write analysis to subcollection
    const analysisRef = await sessionRef.collection('analysis').add({
      ...analysisData,
      sessionId,
      model: 'gpt-4o',
      turnCount: turnsSnap.size,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 5. Mark session as analysed
    await sessionRef.set(
      { hasAnalysis: true, analyzedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    return res.status(200).json({ ok: true, analysisId: analysisRef.id });
  },
);
```

---

## GPT-4o Analysis Schema

The system prompt instructs GPT-4o to return a JSON object with this schema:

```json
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "interestLevel": "number between 1 and 10",
  "mainObjections": "array of up to 3 strings",
  "suggestedNextSteps": "array of up to 3 strings"
}
```

`response_format: { type: 'json_object' }` ensures the model returns parseable JSON. `temperature: 0` ensures deterministic extraction.

---

## Context Hydration — investorContext.js

```js
// LogiFunctionsV2/functions/openai/investorContext.js
exports.getLogiTruckInvestorContext = onRequest({ cors: true }, async (req, res) => {
  const snap = await db.collection('logitruck_public_context').doc('investor_v1').get();

  if (!snap.exists) return res.status(404).json({ ok: false, error: 'Context not found' });

  const context = snap.data();
  if (context.status !== 'approved') {
    return res.status(403).json({ ok: false, error: 'Context is not approved' });
  }

  return res.status(200).json({ ok: true, context });
});
```

Context documents have a `status` field. Only `'approved'` context is served to AI sessions. This allows draft/review iterations without affecting live sessions.

---

## Firestore Schema

```
logitruck_public_context/{contextID}
  status: 'approved' | 'draft' | 'review'
  context data...

logitruck_investor_agent_sessions/{sessionId}
  id: sessionId
  source: 'logitruck-investor-landing'
  hasAnalysis: boolean
  analyzedAt: Timestamp
  createdAt, updatedAt: Timestamp

  /turns/{autoID}
    role: 'user' | 'assistant'
    text: string
    source: string
    clientTimestamp: number (ms)
    createdAt: Timestamp

  /analysis/{autoID}
    name, email, phone: string | null
    interestLevel: number (1-10)
    mainObjections: string[]
    suggestedNextSteps: string[]
    sessionId, model, turnCount, createdAt
```

---

## Orphaned Pattern — OpenAI Assistants API (chatAssistant)

`LogiFunctionsV2/functions/openai/openai.js` contains a `chatAssistant` function using the Assistants API with a polling loop:

```js
// Orphaned — not called from production clients (replaced by aiSupport module)
const run = await openai.beta.threads.createAndRun({
  assistant_id: assistantId,
  thread: { messages: [{ role: 'user', content: userQuestion }] },
});

let status = run.status;
while (status !== 'completed' && status !== 'failed') {
  await new Promise(resolve => setTimeout(resolve, 5000));
  const update = await openai.beta.threads.runs.retrieve(threadId, runId);
  status = update.status;
}
```

**Do not use this pattern.** The polling loop ties up a Cloud Function for up to the `timeoutSeconds` limit (120s), is not idempotent, and has no error handling for `expired` or `cancelled` run states. Use Chat Completions with `response_format: { type: 'json_object' }` for structured extraction (as in `finalizeInvestorSession.js`).

---

## Session ID Generation

The client generates `sessionId` using a UUID or a combination of `userID + timestamp`. The server accepts whatever is provided and upserts on it. This allows the client to start a session offline and sync when connectivity is restored.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Storing conversation history as an array field | Arrays have a 1MB Firestore field limit; subcollection is unbounded |
| Running GPT analysis on every turn (in saveInvestorTurn) | Expensive and slow; analysis belongs in finalize step |
| Hardcoding API key in source code | Use `process.env.OPENAI_API_KEY` or Firebase Secret Manager |
| Polling loop in Cloud Functions | Ties up function CPU/timeout for up to 120s per call |
| Not using `response_format: { type: 'json_object' }` | JSON.parse will throw on free-form responses |
| Serving non-approved context | Status guard on context document prevents accidental data leaks |
| Mixing `role: 'user'` and `role: 'assistant'` turns in the same batch write | Subcollection ordering depends on clientTimestamp; out-of-order writes corrupt the dialogue |

---

## Testing Guidance

```
GIVEN saveLogiTruckInvestorTurn is called with valid sessionId, role, and text
WHEN the function runs
THEN a session document is upserted and a turn document is created in the turns subcollection

GIVEN finalizeInvestorSession is called with a sessionId that has 5 turns
WHEN the function runs
THEN GPT-4o is called with a dialogue string of all 5 turns
AND an analysis document is written to the analysis subcollection
AND session.hasAnalysis is set to true

GIVEN getLogiTruckInvestorContext is called
WHEN the context document has status = 'draft'
THEN a 403 response is returned

GIVEN GPT-4o returns malformed JSON (edge case)
WHEN JSON.parse throws
THEN the function returns 500 with error.message
```

---

## Factory Governance

- Factory generates AI session functions into `/tmp` clone only
- API keys must come from `process.env` — never hardcoded in generated source
- Every `finalizeSession` style function must use `response_format: { type: 'json_object' }` and `temperature: 0`
- Turn storage must use subcollections, never array fields
- Context documents must have a status gate (`status === 'approved'`)
- Polling loops are forbidden — use streaming or Chat Completions
- Claude Code owns review, API key wiring, and deployment
