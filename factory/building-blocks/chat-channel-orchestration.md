# Building Block: Chat Channel Orchestration

## Purpose

Documents the complete chat channel write waterfall in LogiTruck: creating channels, inserting messages, maintaining denormalized social feeds per participant, broadcasting push notifications, updating typing status, and the dual message-store architecture (`messages_live` + `messages_historical`).

---

## Operational Problem Solved

A single message insert must update 4–6 Firestore documents: the message subcollection, the channel metadata, and each participant's `social_feeds` entry. Without a server-side orchestration layer, clients would need to perform these writes themselves — creating race conditions, inconsistent "last message" state, and missed notifications.

---

## Real Examples from Codebase

| File | Function | What it does |
|---|---|---|
| `chat/utils.js` | `createChannel` | Creates channel doc, initializes social feeds |
| `chat/utils.js` | `insertMessage` | Full waterfall: add message → update metadata → hydrate feeds → notify |
| `chat/utils.js` | `hydrateChatFeedsForAllParticipants` | Writes denormalized feed entry for each participant |
| `chat/utils.js` | `broadcastNotificationToAllParticipants` | Sends push to all non-sender participants |
| `chat/chatv2.js` | `deleteMessage` | Removes message, finds next lastMessage, updates metadata |
| `chat/chatv2.js` | `markAsRead` | Updates readUserIDs on message and channel, updates social feed |
| `chat/chatv2.js` | `markUserAsTypingInChannel` | Sets `typingUsers[userID].lastTypingDate` |
| `openai/utils.js` | `insertMessageAI` | Same waterfall + OpenAI Assistants API call |

---

## Channel Document Structure

```js
// channels/{channelID}
{
  id: channelID,
  creatorID: string,
  participants: [{ id, firstName, lastName, profilePictureURL, language, ... }],
  admins: string[] | undefined,  // group chat if present
  name: string | undefined,      // group name if present
  type: 'direct' | 'group',
  status: string,

  // Denormalized last-message metadata (updated on every message)
  lastMessage: string,
  lastMessageDate: number,         // unix seconds
  lastMessageSenderId: string,
  lastThreadMessageId: string,
  readUserIDs: string[],
  typingUsers: { [userID]: { lastTypingDate: number } },
}
```

---

## createChannel Waterfall

```js
// chat/utils.js
exports.createChannel = async (data) => {
  // 1. Idempotency — don't recreate existing channels
  const channel = await chatChannelsRef.doc(id).get();
  if (channel?.exists) return channel.data();

  // 2. Create channel document
  await chatChannelsRef.doc(id).set(data);

  // 3. Initialize social feeds for all participants
  await hydrateChatFeedsForAllParticipants(id, {
    createdAt: Math.floor(Date.now() / 1000),
    senderID: creatorID,
    content: 'New channel created.',
  }, true);

  return data;
};
```

---

## insertMessage Waterfall

```js
// chat/utils.js — 4 sequential async stages
exports.insertMessage = async (data) => {
  const { message, channelID } = data;

  // Stage 1: Add message to messages subcollection
  const messageData = { ...message, createdAt: Math.floor(Date.now() / 1000) };
  messageData.translations = await translateForAllParticipants(participants, message);
  await add(chatChannelsRef.doc(channelID), 'messages', messageData, true);

  // Stage 2: Update channel metadata
  await chatChannelsRef.doc(channelID).set({
    lastMessage: message?.content?.length > 0 ? message.content : message.media,
    lastMessageDate: message?.createdAt,
    lastMessageSenderId: message?.senderID,
    lastThreadMessageId: messageData.id,
    readUserIDs: [message?.senderID],
    typingUsers: {},
  }, { merge: true });

  // Stage 3: Hydrate all participant social feeds
  await hydrateChatFeedsForAllParticipants(channelID, messageData);

  // Stage 4: Push notifications to non-sender participants
  await broadcastNotificationToAllParticipants(channelID, messageData);

  return { success: true };
};
```

---

## hydrateChatFeedsForAllParticipants

Creates/updates a denormalized feed entry for each channel participant in `social_feeds/{userID}/chat_feed/{channelID}`:

```js
const hydrateChatFeedsForAllParticipants = async (channelID, message, isNewChannel = false) => {
  const channel = (await chatChannelsRef.doc(channelID).get()).data();
  const sender = await fetchUser(message.senderID);  // ← Firestore read per insert
  const participants = channel?.participants;

  // Sender feed: markedAsRead = true
  await add(socialFeedsRef.doc(sender.id), 'chat_feed', {
    id: channelID,
    title: isGroupChat ? channel.name : otherParticipantName,
    content: message?.content ?? '',
    markedAsRead: true,   // ← sender has read their own message
    participants, creatorID: channel.creatorID, ...
  }, true);

  // Recipients: markedAsRead = false (unread badge)
  const promises = otherParticipants.map(async (participant) => {
    await add(socialFeedsRef.doc(participant.id), 'chat_feed', {
      id: channelID,
      title: senderName,
      content: message?.content ?? '',
      markedAsRead: false,  // ← unread for recipients
      participants, ...
    }, true);
  });
  await Promise.all(promises);
};
```

**Social feed schema:**
```
social_feeds/{userID}/chat_feed/{channelID}
  id: channelID
  title: string (other user's name for 1:1, group name for groups)
  content: last message text
  markedAsRead: boolean
  participants: [...]
  createdAt: unix seconds
```

---

## broadcastNotificationToAllParticipants

```js
const broadcastNotificationToAllParticipants = async (channelID, message) => {
  const channel = (await chatChannelsRef.doc(channelID).get()).data();
  const sender = await fetchUser(message.senderID);  // ← second Firestore read per insert
  const otherParticipants = participants.filter(p => p.id !== sender.id);

  const promises = otherParticipants.map(async (participant) => {
    await sendPushNotification(participant.id, fromTitle, content, 'chat', {
      channelID, title: fromTitle,
      deeplink: `logitruck://chat/${channelID}`,
    });
  });
  await Promise.all(promises);
};
```

---

## Auto-translation on Insert

```js
// chat/utils.js — message content translated for each participant's language
const participantLanguages = participants.map(p => p.language);
const translations = await Promise.all(participantLanguages.map(async (language) => {
  if (language !== message.language) {
    const [translation] = await translate.translate(message.content, language);
    return { language, translatedContent: translation };
  }
  return { language, translatedContent: message.content };
}));
messageData.translations = translations;
```

Uses `@google-cloud/translate` v2. Adds latency proportional to number of participants. Translation is skipped only when the participant's language matches the message language.

---

## deleteMessage and Dual Message Store

```js
// chat/chatv2.js — deleteMessage
await remove(chatChannelsRef.doc(channelID), 'messages', messageID, true);

// Find next last message from BOTH live and historical subcollections
const live = await chatChannelsRef.doc(channelID).collection('messages_live').orderBy('createdAt', 'desc').limit(1).get();
const hist = await chatChannelsRef.doc(channelID).collection('messages_historical').orderBy('createdAt', 'desc').limit(1).get();

let last = live.docs[0]?.data() ?? null;
if (hist.docs[0]) {
  const temp = hist.docs[0].data();
  if (!last || temp.createdAt > last.createdAt) last = temp;
}
```

The message store uses `messages_live` and `messages_historical` subcollections (not a single `messages` subcollection). The `deleteMessage` function reads from both to find the next last message for metadata update. New messages are inserted with `add(channelRef, 'messages', ...)` where the `add` utility routes to `messages_live`.

---

## markAsRead

```js
// chatv2.js — marks last message as read + updates social feed
exports.markAsRead = onCall(async (req) => {
  const { channelID, userID, messageID, readUserIDs } = req.data;
  const dedupedReadUserIDs = [...new Set(readUserIDs)];

  // Update read status on the specific message
  if (messageID) {
    const doc = await getDoc(chatChannelsRef.doc(channelID), 'messages', messageID);
    if (doc?.ref) doc.ref.set({ readUserIDs }, { merge: true });
  }

  // Update channel-level readUserIDs
  chatChannelsRef.doc(channelID).set({ readUserIDs: dedupedReadUserIDs }, { merge: true });

  // Mark social feed entry as read
  await add(socialFeedsRef.doc(userID), 'chat_feed', { id: channelID, markedAsRead: true });

  return { success: true };
});
```

---

## Typing Status

```js
exports.markUserAsTypingInChannel = onCall(async (req) => {
  const { channelID, userID } = req.data;
  const channel = await chatChannelsRef.doc(channelID).get();
  if (channel.exists) {
    const typingUsers = channel.data()?.typingUsers ?? {};
    typingUsers[userID] = { lastTypingDate: Math.floor(Date.now() / 1000) };
    chatChannelsRef.doc(channelID).set({ typingUsers }, { merge: true });
  }
  return { success: true };
});
```

Typing status is NOT cleared when the user stops typing — it uses `lastTypingDate` and the client clears stale entries locally (entries older than N seconds are considered stale). No explicit clear callable exists.

---

## Performance Concerns

| Operation | Current cost | Risk |
|---|---|---|
| `hydrateChatFeedsForAllParticipants` | 1 channel read + 1 sender user read + N feed writes | O(N participants) writes per message |
| `broadcastNotificationToAllParticipants` | 1 channel read + 1 user read + N FCM sends | O(N) HTTP calls per message |
| Translation on insert | 1 Cloud Translate API call per participant language | Adds 200–800ms per message |
| `fetchUser` called twice per insert | 2 Firestore reads for same user data | Redundant — sender already available |

For group chats with 20+ participants, a single message insert triggers 40+ Firestore writes and 20+ FCM calls synchronously inside one Cloud Function call.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Not calling `hydrateChatFeedsForAllParticipants` on channel create | Feed entry missing; users don't see new channel in their list |
| Not using `dedupedReadUserIDs` in `markAsRead` | Duplicate user IDs in array grow unboundedly |
| Setting `typingUsers` without a clear strategy | Indicator stays on forever without TTL or clear mechanism |
| Creating channel without idempotency check | Duplicate channel overwrites existing messages metadata |
| Awaiting translation inside a `forEach` | `forEach` doesn't await; use `Promise.all(arr.map(...))` |

---

## Factory Governance

- Factory generates channel creation functions using the idempotency-first pattern from `createChannel`
- Factory generates message insertion functions using the 4-stage waterfall
- Translation logic is optional and gated by a feature flag — factory does not include translation by default
- `social_feeds` hydration is a required step for every message insert
- Push notification broadcast is a required step for every message insert
- Factory generates into `/tmp` clone; Claude Code reviews and integrates
