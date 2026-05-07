# Building Block: Stripe Payment Intent Lifecycle

## Purpose

Documents the Stripe integration architecture in LogiTruck: Express account creation for vendor onboarding, subscription payment link generation with revenue sharing, the idempotency guard against re-onboarding, and the critical gaps in the current implementation including the v1 auth vulnerability, hardcoded test key, missing webhook handler, and absent event-driven payment reconciliation.

---

## Operational Problem Solved

LogiTruck uses Stripe Connect (Express accounts) to onboard carrier/vendor companies and collect subscription payments with an application fee split. Vendors must complete Stripe KYC onboarding before they can receive payouts. The platform retains 80% of subscription revenue, with 20% transferred to the vendor account.

---

## Real Examples from Codebase

| File | Function | What it does |
|---|---|---|
| `stripe/stripeconnect.js` | `createStripeAccount` | Creates Stripe Express account, generates onboarding link |
| `stripe/stripeconnect.js` | `createSubscriptionPaymentLink` | Creates Stripe Payment Link with fee split to vendor |

---

## createStripeAccount — Express Account Onboarding

```js
// stripe/stripeconnect.js
exports.createStripeAccount = onCall(async (data) => {  // ← BROKEN: v1 signature
  // AUTH CHECK (BROKEN) — data.auth is undefined in Firebase Functions v2
  if (!data.auth || !data.auth.uid) {
    throw new Error("No autorizado.");  // ← plain Error, not HttpsError
  }
  const userId = data.auth.uid;  // ← data.auth is undefined in v2; auth bypassed
  const email = data.email || data.auth.token.email;

  // Idempotency: check if Stripe account already exists
  const userDocRef = db.collection('stripe_accounts').doc(userId);
  const userDoc = await userDocRef.get();
  let stripeAccountId;

  if (userDoc.exists) {
    stripeAccountId = userDoc.data().stripeAccountId;

    // Already completed onboarding — return early
    if (userDoc.data().chargesEnabled) {
      return { message: 'El usuario ya tiene Stripe configurado.', accountId: stripeAccountId };
    }

    // Needs a fresh onboarding link
    if (data.refresh) {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: 'https://logitruck-f6e40.web.app/stripe/refresh',
        return_url: 'https://logitruck-f6e40.web.app/stripe/success',
        type: 'account_onboarding',
      });
      return { accountId: stripeAccountId, url: accountLink.url };
    }
  } else {
    // Create new Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      settings: {
        payouts: { schedule: { interval: 'manual' } },  // vendor controls payout timing
      },
    });

    stripeAccountId = account.id;

    // Persist to Firestore
    await userDocRef.set({
      userId, email, stripeAccountId,
      createdAt: FieldValue.serverTimestamp(),
      chargesEnabled: false,  // set to true by webhook when onboarding completes
    });
  }

  // Generate initial onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: 'https://logitruck-f6e40.web.app/stripe/refresh',
    return_url: 'https://logitruck-f6e40.web.app/stripe/success',
    type: 'account_onboarding',
  });

  return { accountId: stripeAccountId, url: accountLink.url };
});
```

---

## createSubscriptionPaymentLink — Revenue Split

```js
exports.createSubscriptionPaymentLink = onCall(async (data) => {
  const priceId = 'price_1R2ORNI5kfIUls6cCnUl3tyB';  // ← HARDCODED price ID

  // Validate price in Stripe
  const validPrice = await stripe.prices.retrieve(priceId).catch(() => null);
  if (!validPrice) throw new Error(`Price ${priceId} does not exist`);

  // Get vendor's Stripe account ID
  const userDoc = await db.collection('stripe_accounts').doc(userId).get();
  const stripeAccountId = userDoc.data().stripeAccountId;

  // Create Payment Link with fee split
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    application_fee_percent: 80,        // ← platform keeps 80%
    transfer_data: { destination: stripeAccountId },  // ← 20% to vendor
  });

  // Persist link to Firestore
  await db.collection('stripe_accounts').doc(userId)
    .collection('payment_links').add({
      paymentLink: paymentLink.url,
      priceId, createdAt: FieldValue.serverTimestamp(),
    });

  return { paymentLink: paymentLink.url };
});
```

---

## Firestore Schema

```
stripe_accounts/{userID}
  userId: string
  email: string
  stripeAccountId: "acct_xxx"
  chargesEnabled: boolean    ← set to true by webhook when onboarding complete
  createdAt: Timestamp

stripe_accounts/{userID}/payment_links/{autoID}
  paymentLink: "https://buy.stripe.com/..."
  priceId: "price_..."
  createdAt: Timestamp
```

---

## Idempotency Pattern

```
First call (no doc exists):
  → Create Stripe Express account
  → Write stripe_accounts/{userID} with chargesEnabled: false
  → Generate onboarding link

Re-call after account created but onboarding incomplete:
  → Doc exists, chargesEnabled = false
  → If data.refresh: generate new onboarding link
  → Otherwise: falls through (no link returned — gap in current logic)

Re-call after onboarding complete:
  → Doc exists, chargesEnabled = true
  → Return early: "El usuario ya tiene Stripe configurado."
```

---

## Missing: Webhook Handler

`chargesEnabled` is set to `false` on account creation but there is **no webhook handler** to set it to `true` when Stripe fires `account.updated` with `charges_enabled: true`.

Currently, `chargesEnabled` never becomes `true` in Firestore unless manually set. This means:
- The idempotency guard `if (userDoc.data().chargesEnabled)` never triggers for completed onboardings
- Every call to `createStripeAccount` generates a new onboarding link even for already-onboarded vendors

**Required webhook implementation:**
```js
// Proposed: stripe-webhook.js
exports.stripeWebhook = onRequest({ cors: false }, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'account.updated') {
    const account = event.data.object;
    if (account.charges_enabled) {
      const userSnap = await db.collection('stripe_accounts')
        .where('stripeAccountId', '==', account.id).limit(1).get();
      if (!userSnap.empty) {
        await userSnap.docs[0].ref.update({ chargesEnabled: true });
      }
    }
  }

  return res.status(200).json({ received: true });
});
```

---

## Current Backend Risks

| Risk | Location | Severity |
|---|---|---|
| **Hardcoded Stripe test key** `sk_test_51NJejg...` | `stripeconnect.js` line 4 | **Critical** — test key in production code |
| **v1 `onCall` auth signature** | `stripeconnect.js` | **Critical** — `data.auth` is undefined in v2; auth guard bypassed |
| Hardcoded price ID `price_1R2ORNI5kfIUls6c...` | `stripeconnect.js` line 113 | **High** — breaks if price archived |
| **No Stripe webhook handler** | Entire `stripe/` directory | **High** — `chargesEnabled` never auto-updates |
| Hardcoded return/refresh URLs | `stripeconnect.js` | **Medium** — not environment-configurable |
| `throw new Error(...)` not `HttpsError` | `createSubscriptionPaymentLink` catch | **Medium** — client gets opaque error |
| No payment event reconciliation | Entire `stripe/` directory | **High** — no server-side payment completion handling |

---

## Transaction Boundaries

Stripe API calls are NOT part of any Firestore transaction. The sequence is:
1. Stripe API creates account (external, irreversible)
2. Firestore write persists the account ID

If step 2 fails after step 1 succeeds, the Stripe account exists but is unknown to the app. Recovery requires a manual lookup by email in the Stripe dashboard and a manual Firestore write.

---

## Retry Considerations

- Stripe account creation is NOT idempotent by default — calling `stripe.accounts.create()` twice for the same email creates two Express accounts
- The Firestore existence check before the Stripe API call prevents duplicate creation **only if the first call completed the Firestore write**
- If the Firestore write failed after a successful Stripe API call, the next call will create a duplicate account

**Idempotency key pattern (to be implemented):**
```js
const account = await stripe.accounts.create(
  { type: 'express', ... },
  { idempotencyKey: `create_account_${userId}` }  // Stripe-level dedup
);
```

---

## Scaling Considerations

Payment Links are created per user per subscription plan. There is no limit on the `payment_links` subcollection size. For vendors with many subscription history entries, this subcollection will grow unboundedly. Pagination should be applied when listing payment links.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Hardcoding Stripe API key | Exposed in version control; must use `process.env.STRIPE_SECRET_KEY` |
| Using `data.auth` in v2 `onCall` | Auth is undefined; all callers bypass the auth check |
| Creating Stripe account without idempotency key | Two calls create two accounts for same user |
| Not implementing webhook handler | `chargesEnabled` never updates; idempotency guard never triggers |
| `throw new Error(...)` in `onCall` | Client gets opaque INTERNAL error |
| Hardcoding price ID | Breaks when Stripe price is archived or environment changes |

---

## Factory Governance

- Factory generates Stripe functions with `process.env.STRIPE_SECRET_KEY` only
- Factory uses `request.auth?.uid` not `data.auth.uid`
- Factory uses `HttpsError` for all error paths
- Factory generates a webhook handler for `account.updated` events whenever `createStripeAccount` is generated
- Stripe API calls include idempotency keys derived from user/entity IDs
- Claude Code provisions Stripe webhook endpoint URL and registers it in the Stripe dashboard before deployment
