# Building Block: Assistant Session Persistence

## Purpose

Documents the two-layer persistence architecture for AI assistant sessions in LogiTruck: (1) the OpenAI Assistants API thread-per-channel pattern where `threadID` is stored in the Firestore channel document and reused across messages; and (2) the investor session pattern where every turn is stored as a Firestore subcollection document for later batch analysis.

---

## Operational Problem Solved

AI conversations must persist across reconnects, app restarts, and platform events. The OpenAI Assistants API maintains context in server-side threads, but the client needs to re-attach to the same thread on reconnect. Firestore stores the `threadID` binding so the client always finds its thread. The investor session pattern provides a complete audit trail of every turn for CRM analysis.

---

## Real Examples from Codebase

| File | Pattern | Storage |
|---|---|---|
| `openai/utils.js` `createChannelAI` | Assistants API — creates thread, stores `threadID` in channel doc | `channels/{channelID}.threadID` |
| `openai/utils.js` `insertMessageAI` | Reads `threadID`, adds message, polls for response, writes response back | `channels/{channelID}/messages/{id}` |
| `landing/saveInvestorTurn.js` | Stores each turn (user + assistant) as a subcollection document | `logitruck_investor_agent_sessions/{sessionId}/turns/{autoID}` |
| `landing/finalizeInvestorSession.js` | Reads all turns, analyzes with GPT-4o, stores structured result | `logitruck_investor_agent_sessions/{sessionId}/analysis/{autoID}` |

---

## Pattern 1: Assistants API Thread-Channel Binding

### Channel creation with thread

```js
// openai/utils.js — createChannelAI
exports.createChannelAI = async (data) => {
  const { id, creatorID, isChatBot, threadID } = data;

  // 1. Idempotency: check if Firestore channel already exists
  const channelAI = await chatChannelsAIRef.doc(id).get();
  if (channelAI.exists) return channelAI.data();

  // 2. Check if OpenAI thread already exists (defensive)
  try {
    const existingThread = await openai.beta.threads.retrieve(threadID);
    if (existingThread?.id) return { status: 'error', message: 'Thread already exists' };
  } catch {
    // No existing thread — expected path
  }

  // 3. Create new OpenAI thread
  const newThread = await openai.beta.threads.create();

  // 4. Store binding: Firestore channel doc contains threadID
  await chatChannelsAIRef.doc(id).set({
    ...data,
    threadID: newThread.id,  // ← the binding
  });

  return { status: 'success', data: threadData };
};
```

**The binding:** `channels/{channelID}.threadID = openai_thread_id`. This is the only reference between the Firestore world and the OpenAI world. If this document is deleted, the conversation history in OpenAI becomes unreachable.

### Message insertion with thread continuation

```js
// openai/utils.js — insertMessageAI
exports.insertMessageAI = async (data) => {
  const { message, channelID, assistantID } = data;

  // 1. Read the thread binding
  const channelAI = (await chatChannelsAIRef.doc(channelID).get()).data();
  const threadID = channelAI.threadID;  // ← re-use existing thread

  // 2. Write user message to Firestore first
  await add(chatChannelsAIRef.doc(channelID), 'messages', messageData, true);

  // 3. Update channel metadata (lastMessage, typingUsers)
  await chatChannelsAIRef.doc(channelID).set(updatedMetadata, { merge: true });

  // 4. Update social feeds for all participants
  await hydrateChatFeedsForAllParticipants(channelID, messageData);

  // 5. Add message to OpenAI thread
  await openai.beta.threads.messages.create(threadID, {
    role: 'user',
    content: message?.content,
  });

  // 6. Set typing indicator
  await setAssistantTyping(channelID, senderAI.id);

  // 7. Poll for AI response (blocks up to timeoutSeconds)
  let run = await openai.beta.threads.runs.createAndPoll(threadID, {
    assistant_id: assistantID,
    instructions: 'Answer in the language of the question.',
  });

  if (run.status === 'completed') {
    // 8. Extract last assistant message
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    let lastAssistantMessage = null;
    for (const msg of messages.data.reverse()) {
      if (msg.role === 'assistant') lastAssistantMessage = msg;
    }

    // 9. Write AI response to Firestore
    await add(chatChannelsAIRef.doc(channelID), 'messages', aiResponseData, true);
    await chatChannelsAIRef.doc(channelID).set(updatedAIMetadata, { merge: true });
    await hydrateChatFeedsForAllParticipants(channelID, aiResponseData);
    await clearAssistantTyping(channelID, senderAI.id);
  }
};
```

---

## Firestore Schema for Assistants API Sessions

```
channels/{channelID}                        ← Firestore channel document
  threadID: "thread_abc123"                 ← OpenAI thread binding
  participants: [userParticipant, aiParticipant]
  typingUsers: { [assistantID]: { lastTypingDate } }
  lastMessage, lastMessageDate, readUserIDs

channels/{channelID}/messages/{messageID}  ← message documents
  role: 'user' | 'assistant'
  content: string
  senderID: userID | aiParticipantID
  createdAt: unix timestamp

social_feeds/{userID}/chat_feed/{channelID} ← denormalized feed entry
  title, content, markedAsRead, participants, ...
```

---

## Pattern 2: Turn-by-Turn Session Persistence (Investor)

### Per-turn storage

```js
// landing/saveInvestorTurn.js
exports.saveLogiTruckInvestorTurn = onRequest({ cors: true }, async (req, res) => {
  const { sessionId, role, text, source, timestamp } = req.body;

  // Upsert session document (safe to call on every turn)
  await sessionRef.set({
    id: sessionId, source,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Append turn — subcollection, not array field (unbounded)
  await sessionRef.collection('turns').add({
    role,              // 'user' | 'assistant'
    text,
    source,
    clientTimestamp: timestamp || Date.now(),  // client-provided for ordering
    createdAt: FieldValue.serverTimestamp(),   // server-authoritative
  });

  return res.status(200).json({ ok: true, sessionId });
});
```

### Post-session analysis

```js
// landing/finalizeInvestorSession.js
const turnsSnap = await db
  .collection('logitruck_investor_agent_sessions')
  .doc(sessionId)
  .collection('turns')
  .orderBy('clientTimestamp', 'asc')
  .get();

// Build dialogue
const dialogue = turnsSnap.docs
  .map(doc => `${doc.data().role === 'assistant' ? 'Agent' : 'User'}: ${doc.data().text}`)
  .join('\n');

// GPT-4o structured extraction
const completion = await openai.chat.completions.create({
  model: 'gpt-4o', temperature: 0,
  messages: [
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    { role: 'user', content: `Analyze:\n\n${dialogue}` },
  ],
  response_format: { type: 'json_object' },
});

const analysis = JSON.parse(completion.choices[0].message.content);

// Write analysis as subcollection document
const analysisRef = await sessionRef.collection('analysis').add({
  ...analysis,
  sessionId, model: 'gpt-4o',
  turnCount: turnsSnap.size,
  createdAt: FieldValue.serverTimestamp(),
});

// Mark session as analyzed
await sessionRef.set(
  { hasAnalysis: true, analyzedAt: FieldValue.serverTimestamp() },
  { merge: true }
);
```

---

## Firestore Schema for Turn-Based Sessions

```
logitruck_investor_agent_sessions/{sessionId}
  id: sessionId
  source: 'logitruck-investor-landing'
  hasAnalysis: boolean
  analyzedAt: Timestamp
  createdAt, updatedAt: Timestamp

  /turns/{autoID}
    role: 'user' | 'assistant'
    text: string
    clientTimestamp: number (ms, for ordering)
    createdAt: Timestamp

  /analysis/{autoID}
    name, email, phone: string | null
    interestLevel: 1–10
    mainObjections: string[]
    suggestedNextSteps: string[]
    sessionId, model, turnCount, createdAt
```

---

## Idempotency

- `createChannelAI`: checks `channelAI.exists` before creating thread — safe to retry
- `saveLogiTruckInvestorTurn`: uses `merge: true` on session upsert — safe to retry; adds a new turn doc on each call (NOT idempotent for the turn itself)
- `finalizeInvestorSession`: can be called multiple times — writes new analysis doc each time; `hasAnalysis: true` merge is safe but the analysis collection grows

---

## Failure Recovery

| Failure point | Impact | Recovery |
|---|---|---|
| `openai.beta.threads.create()` fails | No thread created, channel not stored in Firestore | Client retries `createChannelAI` — idempotency check passes |
| `createAndPoll` fails / times out | User message stored in Firestore, AI response not written | User can resend message; typing indicator must be cleared manually |
| `finalizeInvestorSession` OpenAI call fails | Turns stored, analysis not written | Retry the finalize endpoint — all turns still in Firestore |
| Firestore write of AI response fails | AI ran, result generated, not stored | No recovery without rerunning the AI — consider writing to temp doc first |

---

## Current Backend Risks

| Risk | Location | Severity |
|---|---|---|
| Hardcoded OpenAI key | `openai/utils.js` line 15 | **Critical** |
| `createAndPoll` blocks goroutine | `openai/utils.js` | **High** |
| Typing indicator not cleared on `createAndPoll` failure | `openai/utils.js` — no error path for typing | **Medium** |
| `finalizeInvestorSession` hardcoded key | `finalizeInvestorSession.js` line 8 | **Critical** |
| Session turns not deduplicated | `saveInvestorTurn.js` | **Low** — retries add duplicate turns |

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Storing conversation history as array field on channel doc | Array has 1MB Firestore field limit; subcollection is unbounded |
| Retrieving thread ID from client (not Firestore) | Client could forge a different thread ID; always read from trusted Firestore source |
| Not awaiting `clearAssistantTyping` before returning | Typing indicator persists if function errors after AI response |
| Calling `finalizeInvestorSession` during the conversation | Analysis uses all turns; mid-conversation analysis is incomplete |

---

## Factory Governance

- Factory generates turn storage as subcollection writes, never array field appends
- `threadID` binding is always stored in the Firestore channel document — never passed by the client
- All OpenAI API keys come from `process.env.OPENAI_API_KEY`
- Every `createAndPoll` usage must have a try/catch that calls `clearAssistantTyping` in the catch block
- Claude Code reviews and wires credentials before deployment
