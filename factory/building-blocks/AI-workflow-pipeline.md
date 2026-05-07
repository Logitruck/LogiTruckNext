# Building Block: AI Workflow Pipeline

## Purpose

Documents the three distinct AI integration patterns used in LogiTruck Cloud Functions: (1) structured JSON extraction via Chat Completions, (2) vision-based ticket extraction with strict JSON schema, and (3) the Assistants API with thread persistence. Each pattern has different latency, cost, and reliability characteristics.

---

## Operational Problem Solved

AI calls are slow (1–30 seconds), expensive, and non-deterministic. The pipeline must: set an initial processing state before the AI call, handle AI failure without corrupting application state, write structured results atomically after success, and mark error state on failure — all in a way the client can observe in real time via Firestore listeners.

---

## Real Examples from Codebase

| File | AI pattern | Model | Input | Output |
|---|---|---|---|---|
| `landing/finalizeInvestorSession.js` | Chat Completions + `json_object` | `gpt-4o` | Dialogue string | Structured investor analysis |
| `tickets/processJobTicket.js` | Responses API + `json_schema` (strict) | `gpt-4.1` | Image URL + text | Extracted ticket fields |
| `openai/utils.js` (`insertMessageAI`) | Assistants API + `createAndPoll` | Configurable assistant | User message text | Conversational AI response |
| `openai/openai.js` (`chatAssistant`) | Assistants API + polling loop | Configurable | Query string | Orphaned — not in production |

---

## Pattern 1: Chat Completions with json_object

```js
// landing/finalizeInvestorSession.js
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0,       // ← deterministic extraction
  messages: [
    { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
    { role: 'user', content: `Analyze this conversation:\n\n${dialogue}` },
  ],
  response_format: { type: 'json_object' },  // ← guaranteed JSON output
});

const analysisData = JSON.parse(completion.choices[0].message.content);
```

**When to use:** Post-processing of text content where the output structure is known but does not require strict field enforcement. The model can return any valid JSON object; `JSON.parse` is the only validation.

**Risk:** `json_object` mode does not enforce a schema — the model may return unexpected fields or omit required ones. Always validate the parsed result before writing to Firestore.

---

## Pattern 2: Responses API with Strict JSON Schema

```js
// tickets/processJobTicket.js
const ticketSchema = {
  name: 'job_ticket_extraction',
  schema: {
    type: 'object',
    additionalProperties: false,       // ← strict — no extra fields
    properties: {
      ticketNumber: { type: ['string', 'null'] },
      issueDate: { type: ['string', 'null'] },
      needsManualReview: { type: 'boolean' },
      detectedFields: { type: 'array', items: { ... } },
      confidence: { type: ['number', 'null'] },
      // ...
    },
    required: ['ticketNumber', 'issueDate', 'needsManualReview', ...],
  },
};

const response = await openai.responses.create({
  model: 'gpt-4.1',
  input: [
    { role: 'system', content: [{ type: 'input_text', text: SYSTEM_PROMPT }] },
    { role: 'user', content: [
      { type: 'input_text', text: 'Analyze this ticket...' },
      { type: 'input_image', image_url: imageUrl },  // ← vision input
    ]},
  ],
  text: {
    format: {
      type: 'json_schema',
      name: ticketSchema.name,
      schema: ticketSchema.schema,
      strict: true,  // ← enforces schema at model level
    },
  },
});

const extractedData = JSON.parse(response.output_text);
```

**When to use:** Vision-based extraction where output fields are strictly defined and partial results are not acceptable. `strict: true` + `additionalProperties: false` guarantees the model cannot return fields outside the schema.

---

## Pattern 3: Assistants API with createAndPoll

```js
// openai/utils.js — insertMessageAI
await openai.beta.threads.messages.create(threadID, {
  role: 'user',
  content: message?.content,
});

let run = await openai.beta.threads.runs.createAndPoll(threadID, {
  assistant_id: assistantID,
  instructions: 'Answer in the language of the question.',
});

if (run.status === 'completed') {
  const messages = await openai.beta.threads.messages.list(run.thread_id);
  // Find last assistant message
  for (const msg of messages.data.reverse()) {
    if (msg.role === 'assistant') {
      lastAssistantMessage = msg;
    }
  }
  // Write response to Firestore
}
```

**When to use:** Stateful multi-turn conversations where the OpenAI thread maintains history. The `threadID` is stored in the Firestore channel document and reused on every message.

**Critical risk:** `createAndPoll` is a synchronous polling loop that blocks the Cloud Function goroutine. It polls every ~1 second until the run completes or fails. With a 120s function timeout and runs taking 5–15 seconds, this is safe for light loads but will hit concurrency limits under sustained traffic. **Do not use `createAndPoll` in functions that will be called at high frequency.**

---

## Optimistic Status Write Pattern

```js
// tickets/processJobTicket.js — set pending BEFORE AI call
await jobRef.set({
  [ticketField]: {
    processingStatus: 'pending',    // ← client sees 'processing' immediately
    processingError: null,
  },
}, { merge: true });

try {
  const response = await openai.responses.create({ ... });
  const extractedData = JSON.parse(response.output_text);

  await jobRef.set({
    [ticketField]: {
      processingStatus: 'processed',   // ← success
      processedAt: FieldValue.serverTimestamp(),
      extractedData,
      processingError: null,
    },
  }, { merge: true });

  return { success: true, extractedData };

} catch (error) {
  await jobRef.set({
    [ticketField]: {
      processingStatus: 'failed',      // ← failure preserved
      processedAt: FieldValue.serverTimestamp(),
      processingError: error?.message || 'Unknown error',
    },
  }, { merge: true });

  throw new HttpsError('internal', error?.message || 'Failed to process ticket');
}
```

Three-state lifecycle: `pending` → `processed` | `failed`. The client observes state via `onSnapshot` on the job document.

---

## Processing State Schema

```
job document
  pickupTicket:
    processingStatus: 'pending' | 'processed' | 'failed'
    processedAt: Timestamp | null
    extractedData: { ticketNumber, issueDate, ... } | null
    processingError: string | null
  deliveryTicket:
    (same structure)
```

---

## AI Response Validation

`json_object` mode: always validate required fields after `JSON.parse`:
```js
const result = JSON.parse(completion.choices[0].message.content);
if (typeof result.interestLevel !== 'number' || !Array.isArray(result.mainObjections)) {
  throw new Error('AI returned unexpected schema');
}
```

`json_schema` strict mode: schema is enforced at model level — `JSON.parse` is sufficient. The `needsManualReview: true` field is the model's own signal for low-confidence extractions.

---

## Typing Indicators for AI

```js
// openai/utils.js — set typing before AI call, clear after
await setAssistantTyping(channelID, assistantID);

let run = await openai.beta.threads.runs.createAndPoll(threadID, { ... });

if (run.status === 'completed') {
  // write response
  await clearAssistantTyping(channelID, assistantID);
}
```

`setAssistantTyping` adds the AI participant to `channel.typingUsers`. The client's `onSnapshot` listener shows the typing indicator in real time. `clearAssistantTyping` removes it after the response is written.

---

## Failure Recovery Strategy

| Failure point | Recovery |
|---|---|
| OpenAI API timeout | `processingStatus: 'failed'` with error message; client can retry by re-calling the function |
| `JSON.parse` failure | Same — caught by catch block, writes failed status |
| Firestore write failure after AI success | AI result is lost; no recovery without client retry. Consider writing to a staging doc first, then promoting. |
| `createAndPoll` hangs past timeout | Cloud Function forcibly terminated; run may still be in-flight in OpenAI. Next retry creates a new run. |

---

## Current Backend Risks

| Risk | Location | Severity |
|---|---|---|
| Hardcoded OpenAI API key | `finalizeInvestorSession.js` line 8, `processJobTicket.js` line 8, `openai/utils.js` line 15, `openai/openai.js` line 23 | **Critical** |
| `createAndPoll` blocks Cloud Function | `openai/utils.js` | **High** — max 120s timeout |
| No `json_object` schema validation | `finalizeInvestorSession.js` | **Medium** |
| `chatAssistant` function is orphaned | `openai/openai.js` | **Low** — dead code, should be removed |

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `JSON.parse` without try/catch | AI can return malformed JSON even in `json_object` mode |
| Writing AI results without setting `pending` status first | Client sees no state change until completion; poor UX |
| Hardcoding API key in function file | Key exposed in version control |
| Using polling loop (`while status !== 'completed'`) instead of `createAndPoll` | Manually polling blocks longer and has no built-in backoff |
| Not clearing typing status on error path | Typing indicator stays on forever if AI call fails |
| Using Assistants API for one-shot extraction | Unnecessary thread overhead; use Chat Completions |

---

## Factory Governance

- Factory uses Chat Completions with `response_format: { type: 'json_object' }` for text extraction
- Factory uses Responses API with `json_schema` + `strict: true` for image/document extraction
- All AI functions use `process.env.OPENAI_API_KEY` — never hardcoded
- Every AI function writes `processingStatus: 'pending'` before the AI call
- Every AI function has a catch block that writes `processingStatus: 'failed'` with the error message
- `createAndPoll` is permitted only in functions with `timeoutSeconds: 120` set
- Claude Code removes hardcoded keys and wires environment variables before deployment
