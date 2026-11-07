# Reference walkthrough: notification system

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Scope
A shared platform: **internal services and campaigns** ask, the platform delivers by **push, SMS
and email**. It owns **preferences and frequency caps**, so no team can skip them, and a
**status history** for 30 days. Non-functional: **accepted means never lost** (at-least-once,
with duplicates suppressed), **login codes in seconds even during a campaign**, and **one bad
provider must not hurt the other channels**.

## 2. Estimates
500M/day ≈ **5.8k sends/s** on average, **~58k/s** in a campaign burst. History: 500M × 30 days ×
~500 B ≈ **7.5 TB**. Devices: 300M × ~250 B ≈ **75 GB**, small enough to cache. The binding
constraint is not our hardware but the **providers' rate limits and latency**, plus SMS cost.

## 3. API and data
`POST /notifications` with template, params, category, priority and an **idempotency key**,
answered with **202** after persisting. `GET /notifications/{id}` for status. Preferences and device
registration endpoints for the apps. Data: devices/contacts and preferences in SQL (cached), and a
`notification_log` in NoSQL with a 30-day TTL that also holds idempotency state.

## 4. Evolving the design
- **v1:** a synchronous service calls providers inline. Slow providers block callers, blips lose
  messages, and campaigns starve login codes.
- **v2:** a load-balanced **API that accepts and persists**, then **per-channel queues** drained by
  channel workers. Callers are decoupled, and a slow SMS vendor only backs up SMS. Login codes
  still wait behind marketing.
- **v3:** queues by **channel × priority** with dedicated workers; a **scheduler** paces campaigns;
  **per-user caps and per-provider token buckets** in a counter store; **retry delay queue with
  backoff → DLQ** and idempotency checks.

## 5. Deep dives
- **Retries.** No retry loses OTPs; tight retry loops hammer a sick provider. Use a delay queue with
  exponential backoff and jitter, then a DLQ. A timeout is ambiguous ("did it send?"), so carry an
  idempotency key and check the log before resending; drop OTPs past their TTL.
- **Isolation.** One queue mixes everything; per-channel queues fix provider coupling; adding
  **priority** fixes the campaign-vs-OTP problem. These are bulkheads.
- **Throttling.** User caps are a product rule enforced once at the gate. Provider limits are an
  operational rule enforced by the workers with token buckets, so a burst is spread out instead
  of rejected.

## 6. Wrap-up
Bottlenecks: segment expansion for campaigns (paced scheduler), preference lookups (cache),
provider throughput (buckets, multiple vendors). Provider outage: queue, back off, open a
circuit breaker, fail over to a secondary vendor. Watch queue age per class, accept→sent latency
for transactional traffic, provider error/throttle rates, DLQ size and SMS spend.

## Transferable pattern
**Accept fast, deliver asynchronously:** validate and persist, enforce policy at one gate, then
route into per-class queues drained by workers that own retries, idempotency and third-party rate
limits. The same shape fits webhooks delivery, payment payouts, email marketing and any
integration with flaky external APIs.
