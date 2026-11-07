# Reference walkthrough: chat system

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Scope
Core: **send a message** 1:1 and to **groups (≤ 200)**, delivered to every device; **history for a
year** that syncs to any device; **offline** users get a push and catch up on reconnect. Presence
and read receipts are secondary. Non-functional: **sub-second delivery**, **no loss after ack and
the same order everywhere**, and server failures that cost only a reconnect.

## 2. Estimates
50M DAU × 40 = **2B messages/day** ≈ 23k/s average, **~70k/s at peak**. 20% online at peak means
**~10M open connections**; at ~60k per box that is ~170 gateways. Storage: 2B × 200 B × 365 ≈
**146 TB/year** before replication. Group traffic multiplies deliveries: with a third of messages
going to ~50 recipients on average, peak deliveries are over a million per second, which is why
fan-out deserves its own tier.

## 3. API and data
`send` (over the WebSocket or `POST /conversations/{id}/messages`) carries a **client_msg_id** so
retries are idempotent and returns `{message_id, seq}`. `GET …/messages?after_seq=` pages history
and powers catch-up. Data: `messages` partitioned by **conversation_id**, clustered by **seq**
(wide-column store); `conversation_members` in SQL; an ephemeral **session registry**
(device → gateway, with a heartbeat TTL) in Redis that doubles as presence.

## 4. Evolving the design
- **v1:** HTTP + polling against one service and one SQL DB. Polling 10M clients every second is
  ~10M mostly-empty requests/s and still up to a second late.
- **v2:** **WebSocket gateways** behind an L4 load balancer, a **session registry** to find the
  recipient's gateway, and a **wide-column message store**. The chat service still delivers inline,
  so group sends are slow and fragile.
- **v3:** persist once with a **per-conversation seq**, ack the sender, publish to a **stream
  partitioned by conversation**; **fan-out workers** deliver to online devices and send the rest
  to a **push service** (APNs/FCM).

## 5. Deep dives
- **Transport.** Short polling wastes requests and adds delay; long polling reconnects per message;
  **WebSockets** let the server push instantly. The cost, stateful servers, is contained in the
  gateway tier plus a registry.
- **Ordering and duplicates.** Client clocks disagree and a global sequence is an unnecessary
  bottleneck. Order **per conversation**: one owner assigns seq; delivery is **at-least-once**,
  duplicates are dropped by client_msg_id / seq; clients sort by seq and fetch gaps.
- **Group fan-out.** Inline delivery makes the sender wait for 200 recipients. Async workers off a
  stream keep the ack fast and retry delivery independently.

## 6. Wrap-up
Bottlenecks: hot large groups, registry lookups (cache, shard by user), hot conversation
partitions. A crashed gateway means clients reconnect (with jitter) elsewhere and sync from their
last seq; the stream lets workers replay. Watch send→deliver latency, connections per gateway,
reconnect storms, consumer lag and push failures. At larger scale: more gateways and partitions,
and pull-on-open for very large groups.

## Transferable pattern
**Stateful connection tier + stateless routing:** terminate long-lived connections on a dedicated
fleet, keep a registry of who is connected where, persist once with a per-entity sequence, and fan
out asynchronously (push for the disconnected). The same shape powers live comments, multiplayer
lobbies, collaborative cursors and trading tickers.
