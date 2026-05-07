# Building Block: Notification Trigger Pattern

## Purpose

Documents the complete push notification pipeline in LogiTruck: FCM token resolution, badge count management, Firestore persistence, and the specific notification types triggered from business events. Also documents the legacy push-to-FCM token recovery path and the hardcoded server key risk.

---

## Operational Problem Solved

Push notifications in a multi-platform app (iOS + Android) require: a valid FCM token per device, correct badge counting per user, persistent notification history for the in-app feed, and structured metadata for deep linking. Centralizing this in a single utility function ensures every triggering Cloud Function sends consistent, observable notifications.

---

## Real Examples from Codebase

| Triggering file | Notification type | Recipient |
|---|---|---|
| `distributeRequest/distributeRequest.js` | `deal_invitation` | All carrier/dispatch users for matched vendors |
| `chat/utils.js` | `chat` | All non-sender participants in a channel |
| `openai/utils.js` | (via `broadcastNotificationToAllParticipants`) | AI channel participants |

---

## sendPushNotification Utility

```js
// notifications/utils.js
const sendPushNotification = async (toUserID, titleStr, contentStr, type, metadata = {}) => {
  try {
    // 1. Fetch user document to get FCM token
    const toUser = await fetchUser(toUserID);
    if (!toUser) return null;

    const pushToken = toUser.pushToken;
    let fcmToken = toUser.fcmToken;

    // 2. Recover FCM token from legacy APNs push token if missing
    if (!fcmToken || fcmToken.length === 0) {
      fcmToken = await retrieveFCMTokenForPushToken(pushToken);
      if (fcmToken?.length > 0) {
        await updateUser(toUserID, { fcmToken });  // cache the recovered token
      } else {
        return null;  // no valid token — silently skip
      }
    }

    // 3. Increment badge count
    const userBadgeCount = await handleUserBadgeCount(toUser);

    // 4. Build FCM message
    const message = {
      token: fcmToken,
      notification: { title: titleStr, body: contentStr },
      data: {
        deeplink: metadata?.deeplink || '',
        type: type || '',
        // All metadata values must be strings
        ...Object.fromEntries(
          Object.entries(metadata || {}).map(([k, v]) => [k, String(v)])
        ),
      },
      apns: {
        payload: { aps: { badge: userBadgeCount } },
      },
    };

    // 5. Send via FCM Admin SDK
    const response = await admin.messaging().send(message);

    // 6. Persist to Firestore notifications collection
    await saveNotificationsToDB(toUser, titleStr, contentStr, type, metadata);

    return { success: true };
  } catch (error) {
    console.error('❌ [sendPushNotification] Error:', error);
    return null;  // never throw — notification failure should not crash business logic
  }
};
```

---

## FCM Token Recovery from Legacy Push Token

```js
// notifications/utils.js — retrieveFCMTokenForPushToken
const retrieveFCMTokenForPushToken = async (pushToken) => {
  const url = 'https://iid.googleapis.com/iid/v1:batchImport';
  const config = {
    headers: {
      Authorization: 'key=AAAABVjck0Q:APA91bG...',  // ← HARDCODED LEGACY KEY (RISK)
      'Content-Type': 'application/json',
    },
  };

  const res = await axios.post(url, {
    apns_tokens: [pushToken],
    application: 'io.instamobile.rn.ios.demo',  // ← HARDCODED BUNDLE ID (RISK)
    sandbox: false,
  }, config);

  return res.data.results[0].registration_token;
};
```

This function recovers an FCM token for apps that stored APNs tokens instead of FCM tokens (legacy migration path). The `Authorization` key and `application` bundle ID are hardcoded.

**Active risks:**
1. The legacy FCM server key (`key=AAAABVjck0Q:...`) in the header is exposed in version control
2. The bundle ID `io.instamobile.rn.ios.demo` is a template app ID — not the production LogiTruck ID
3. The IID `batchImport` API is deprecated by Firebase; FCM v1 API does not support this path

---

## Badge Count Management

```js
// notifications/utils.js
const handleUserBadgeCount = async (user) => {
  const newBadgeCount = (user?.badgeCount ?? 0) + 1;
  await updateUser(user.id, { badgeCount: newBadgeCount });  // write to users/{id}
  return newBadgeCount;
};
```

Badge count is stored on the user document and incremented on every notification. There is no decrement path in the notification utility — badge clearing is handled by the client (typically on app open or notification tap).

---

## Firestore Notification Persistence

```js
// notifications/utils.js — saveNotificationsToDB
const saveNotificationsToDB = async (toUser, title, body, type, metadata) => {
  const ref = await notificationsRef.add({
    toUserID: toUser.id,
    title, body, metadata, toUser,
    type, seen: false,
    createdAt: Math.floor(Date.now() / 1000),
  });
  // Write the generated ID back to the document
  notificationsRef.doc(ref.id).update({ id: ref.id });
};
```

Two writes per notification:
1. `notificationsRef.add(...)` — creates document, generates ID
2. `notificationsRef.doc(ref.id).update({ id: ref.id })` — writes ID back to doc

The two-write pattern means there is a brief window where the notification document exists without an `id` field. The `notifications/notifications.js` `listNotifications` callable must handle documents where `id` may be missing.

---

## Notification Data Types

| Type string | Trigger | Metadata keys |
|---|---|---|
| `deal_invitation` | New request distributed to vendor | `requestID`, `vendorID`, `finderID`, `matchedRoutesCount`, `totalRoutes`, `deeplink` |
| `chat` | New message in channel | `channelID`, `title`, `deeplink` |
| (others) | Various triggers | Vary by trigger |

All metadata values are cast to `String` before inclusion in the FCM `data` payload — FCM data payloads only support string values.

---

## Deep Link Format

```
deeplink: `mychat://deal/${requestID}`       // deal invitation
deeplink: `logitruck://chat/${channelID}`    // chat message
```

The deep link schema (`mychat://` vs `logitruck://`) is inconsistent across notification types. `deal_invitation` uses `mychat://` while `chat` uses `logitruck://`. These should be unified under `logitruck://`.

---

## Retry and Idempotency

`sendPushNotification` has no deduplication guard. If the triggering Cloud Function is retried, the notification fires again. This is an open risk documented in `idempotent-event-processing.md`.

The FCM Admin SDK `admin.messaging().send()` does not deduplicate. Multiple sends to the same token for the same event produce multiple device notifications.

---

## Failure Recovery Strategy

```js
// Notification failures are caught and suppressed
try {
  const response = await admin.messaging().send(message);
  await saveNotificationsToDB(...);
  return { success: true };
} catch (error) {
  console.error('❌ [sendPushNotification] Error:', error);
  return null;  // ← failure returns null, never throws
}
```

Notification failures are swallowed. The triggering function does not fail if a push cannot be sent. This is intentional — a failed push should not roll back a business operation (e.g., a vendor_request being created should succeed even if the notification fails).

---

## Scaling Considerations

`sendPushNotification` makes 2–3 Firestore reads (user document, badge count write, notifications write) and 1 FCM HTTP call per recipient. For `distributeRequest` notifying 10 eligible users across 5 vendors, that is 50+ Firestore operations and 50 FCM calls synchronously in one trigger execution.

With Cloud Tasks (see `cloud-task-orchestration.md`), each vendor's notification batch would run in isolation, with independent retry on FCM failure.

---

## Current Backend Risks

| Risk | Location | Severity |
|---|---|---|
| Hardcoded FCM legacy server key | `notifications/utils.js` line 131 | **Critical** |
| Hardcoded bundle ID (`io.instamobile.rn.ios.demo`) | `notifications/utils.js` line 143 | **High** — wrong app ID for production |
| IID `batchImport` API deprecated | `notifications/utils.js` | **Medium** — will stop working on Firebase deprecation date |
| No notification deduplication | All notification senders | **Medium** — duplicate pushes on retry |
| Two-write pattern for notification ID | `saveNotificationsToDB` | **Low** — window with missing `id` field |
| Inconsistent deep link schema | `deal_invitation` vs `chat` | **Low** |

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| `throw` from `sendPushNotification` | Notification failure must not fail business logic |
| Awaiting `sendPushNotification` sequentially in a loop | O(N) latency; use `Promise.all` |
| Passing non-string metadata values to FCM | FCM data payload only supports strings; `String(value)` cast is required |
| Using `badgeCount` as the iOS app badge without a clear path | Badge count grows forever without client-side reset |
| Hardcoding FCM server key | Exposed in version control; must use environment variable or Secret Manager |

---

## Testing Guidance

```
GIVEN toUserID has no fcmToken but has pushToken
WHEN sendPushNotification runs
THEN retrieveFCMTokenForPushToken is called and the recovered token is used and cached

GIVEN FCM send throws a network error
WHEN sendPushNotification catches the error
THEN the function returns null and does not rethrow

GIVEN a notification is sent successfully
WHEN saveNotificationsToDB runs
THEN a document is created in notifications collection with seen=false

GIVEN metadata contains a numeric value (matchedRoutesCount: 3)
WHEN the message data is built
THEN the value is cast to "3" (string)
```

---

## Factory Governance

- Factory uses `process.env.FCM_SERVER_KEY` — never hardcoded
- Factory uses `process.env.APP_BUNDLE_ID` for the bundle ID in token recovery
- All notification sends use `Promise.all` — never sequential `await` in a loop
- `sendPushNotification` always wraps in try/catch and returns `null` on failure, never throws
- Deep links use `logitruck://` scheme consistently
- Claude Code replaces hardcoded keys with env vars before deployment
