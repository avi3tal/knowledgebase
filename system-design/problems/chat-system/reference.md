# Solution: WhatsApp (chat system)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The server has to **speak first**. A message must reach a phone that is idle with the app open, so
the design is built around **millions of long-lived connections**. Those connections are stateful,
and everything else should not be:
- a gateway tier that holds sockets, plus a small registry of who is connected where;
- one stored copy of each message with a **per-conversation order**;
- asynchronous fan-out for groups, and push plus cursor sync for anyone offline.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Send a 1:1 message; it reaches every device of the recipient |
| F2 | Groups of up to 200 members |
| F3 | One year of history that syncs to any device, including a new one |
| F4 | Offline recipients get a push and catch up when they reconnect |
| F5 | Secondary: online indicator and read receipts |
| N1 | Online-to-online delivery < 500 ms p99 |
| N2 | Never lose an acknowledged message; same order on every device |
| N3 | Losing a server costs only a reconnect; ~10M concurrent connections |

**Assumptions:** 50M DAU × 40 messages, 20% connected at peak, peak = 3× average, ~200 B per
message, media stored elsewhere. **Out of scope:** end-to-end encryption keys, calls, media upload.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| messages / day | 50M × 40 | **2B** |
| send rate | 2B / 86,400 s, × 3 at peak | **23k /s**, peak **~70k /s** |
| open connections | 50M × 1/5 | **10M** |
| gateways | 10M / 60k per box | **~170** |
| registry memory | 10M × ~100 B | **~1 GB** |
| storage / year | 2B × 365 × 200 B | **~146 TB** (~440 TB with 3 replicas) |
| deliveries at peak | 70k × (⅔ × 1 + ⅓ × 50) | **~1.2M /s** |

What the numbers say: the send rate is ordinary, but **deliveries are ~20× sends** because of
groups, and **10M sockets** need a dedicated fleet. Storage needs a store that is sharded by
conversation from day one.

## 3. API and data model
- `WS /ws` (one socket per device): the server pushes `message`, `receipt` and `presence` frames,
  and the client acks by seq.
- `POST /conversations/{id}/messages {client_msg_id, text, media_url?}` (or the same as a socket
  frame) → `{message_id, seq, created_at}`. The ack means *persisted*, and `client_msg_id` makes
  retries idempotent.
- `GET /conversations/{id}/messages?after_seq=&limit=` pages history and drives catch-up.
- `GET /conversations?changed_since=` → `[{conversation_id, last_seq}]` tells a reconnecting device
  what to sync.

| entity | key and fields | store |
|---|---|---|
| `messages` | `conversation_id` (partition), `seq` (clustering), message_id, client_msg_id, sender, body, ts | Cassandra (wide-column) |
| `conversations`, `conversation_members` | conversation_id, type, last_seq; member user_id, role, last_read_seq | SQL, cached |
| `sessions` | device_id → gateway_id, user_id, heartbeat TTL 60 s | Redis |
| `devices` | user_id, device_id, platform, push_token | SQL |

## 4. Decompose: the parts
Four hard sub-problems, each solved on its own and merged by node id.

### Part P1: Connection tier and routing (F1, N1, N3)
Hold 10M open sockets on ~170 gateways, and find the gateway that holds a recipient's device.

| option | pros | cons |
|---|---|---|
| broadcast every message to every gateway | no routing state | every gateway does every delivery: 1.2M/s × 170 |
| consistent hash user → gateway | no lookup | the LB must parse auth; all of a user's devices land on one box; a lost gateway moves many users |
| **connect anywhere + session registry with TTL** | any device on any gateway; doubles as presence | one lookup per delivery; stale entries until the TTL |

**Choice:** gateways behind an L4 load balancer register `device → gateway` in Redis on connect and
refresh it with heartbeats. Only this tier is stateful, the registry is about 1 GB, and a crashed
gateway's entries expire within a minute.

```diagram
part:P1
```

### Part P2: Message persistence and ordering (F1, F3, N2)
Store ~70k messages/s once, in an order every device agrees on, and keep 146 TB a year readable.

| option | pros | cons |
|---|---|---|
| client timestamps | no coordination | clocks skew, so phones disagree |
| one global sequence | total order | a single hot counter and point of failure, for an order nobody needs |
| Snowflake-style time ids | no shared state | same-millisecond sends can swap; gaps are invisible |
| **per-conversation seq + wide-column store** | order exactly where users see it; gaps are detectable | one counter per conversation; busy groups are hot partitions |

**Choice:** the chat service takes `INCR seq:{conversation}` from a sharded counter, then appends to
Cassandra under `(conversation_id, seq)` and bumps `conversations.last_seq`. A repeated
`client_msg_id` returns the original ack instead of writing again. "Latest N of conversation X" is
then one partition read.

```diagram
part:P2
```

### Part P3: Offline delivery, push and catch-up (F3, F4)
A device with no socket must learn that something arrived, then fetch exactly what it missed.

| option | pros | cons |
|---|---|---|
| per-device inbox queue | trivial drain | writes multiply by devices; a lost phone's queue grows forever |
| message inside the push payload | one hop | push is best effort with tiny payloads; it can't fill gaps |
| **push as a wake-up hint + cursor sync** | one stored copy; works for new devices too | the client keeps a cursor per conversation |

**Choice:** fan-out workers send a push through APNs/FCM to devices with no session. The device
then calls `changed_since`, and pulls `after_seq` for each conversation whose `last_seq` moved.
Because P2 already stores every message once and in order, a cursor is all a device needs.

```diagram
part:P3
```

### Part P4: Group fan-out (F2, N1)
A third of messages go to groups of up to 200 people: ~1.2M deliveries/s at peak.

| option | pros | cons |
|---|---|---|
| sender's server delivers inline | simple | the ack waits on 200 recipients; one slow gateway stalls the sender |
| copy into every member's inbox | member reads are one query | ~200 writes per group message for data already stored |
| **persist once, stream, async fan-out workers** | sender acked after one write; delivery retries alone | an extra hop (tens of ms); duplicates possible |

**Choice:** after the write, the chat service publishes to Kafka keyed by conversation, so order
survives the hop. Workers read the members (cached), look up their gateways and deliver. Delivery can
lag and retry without touching the sender's latency.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** HTTP polling against one service and one SQL table. 10M clients polling every second
is ~10M mostly empty requests/s, and messages are still up to a second late.
```diagram
v1
```
**v2, compose P1 and P2:** WebSocket gateways, the session registry, per-conversation sequence and the
wide-column store. The chat service still delivers inline, so group sends are slow.
```diagram
v2
```
**v3, compose P4:** persist, ack, then publish to a stream; fan-out workers deliver to gateways.
```diagram
v3
```
**v4, compose P3:** offline devices get a wake-up push and catch up by cursor.
```diagram
v4
```

## 6. Deep dives
- **Transport.** Short polling wastes requests and adds up to a second of delay. Long polling
  needs a new request per message. **WebSockets** let the server push instantly, and their cost,
  stateful servers, stays inside P1. Keep long polling as a fallback for networks that block
  upgrades.
- **Duplicates and gaps.** Delivery is **at-least-once**: senders retry until acked, workers replay
  from their Kafka offset after a crash, and phones reconnect mid-stream. The store ignores a
  repeated `client_msg_id`. Clients drop a seq they already have and fetch any gap, so every device
  ends up with the same ordered list.
- **Reconnect storms.** When a gateway with 60k sockets dies, an immediate reconnect would hit the
  load balancer with all of them at once. Use exponential backoff with jitter, then sync after the
  last seq.
- **Presence and receipts.** Pushing every online/offline change to all contacts would outweigh the
  messages themselves. Read presence from the registry when a chat opens. A receipt is "read up to
  seq N": update `last_read_seq` and send it as a tiny message on the same path.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [WebSockets / SSE](#/topic/system-design/websockets-sse) | one bidirectional socket per device | long polling, MQTT |
| [Envoy / NGINX](#/topic/system-design/envoy-nginx) | L4 load balancing of long-lived connections | cloud NLB, HAProxy |
| [Redis](#/topic/system-design/redis) | session registry with TTL; per-conversation counters | etcd (too slow for this rate), Memcached |
| [Cassandra](#/topic/system-design/cassandra) | `messages` by (conversation_id, seq) | HBase, ScyllaDB, DynamoDB |
| [Kafka](#/topic/system-design/kafka) | message stream keyed by conversation | Pulsar, Kinesis |
| [PostgreSQL](#/topic/system-design/postgresql) | conversations, members, devices | MySQL |

## 8. Patterns
- [Real-time push](#/topic/system-design/real-time-push): the server speaks first over a held
  connection, and push wakes up the rest.
- [Fan-out](#/topic/system-design/fan-out): one write becomes many deliveries, done asynchronously.
- [Idempotency](#/topic/system-design/idempotency): `client_msg_id` makes a retried send harmless.
- The transferable shape is a **stateful connection tier with stateless routing**. Hold connections
  on a dedicated fleet, keep a registry of who is where, persist once with a per-entity sequence,
  and fan out asynchronously. Live comments, multiplayer lobbies and collaborative cursors use the
  same shape.

## 9. Evaluation
- **Bottlenecks:** big active groups (fan-out cost and a hot partition), registry lookups on every
  delivery (shard by device, cache on workers), and the counter of a busy conversation.
- **Failures:** a lost gateway costs a jittered reconnect and a cursor sync. Kafka retains messages,
  so lagging or crashed workers replay. Retried sends are deduped. If push is down, devices still
  catch up when opened.
- **Monitoring:** send → device-ack latency at p99, connections per gateway, reconnect rate,
  consumer lag, registry hit rate and push failure rate.
- **The 30-second answer:** WebSocket gateways behind an L4 LB, with a Redis registry of device →
  gateway. The chat service assigns a per-conversation seq, writes once to Cassandra and acks, then
  publishes to Kafka. Fan-out workers deliver to online devices and send APNs/FCM pushes to the rest,
  which catch up with `after_seq`. Delivery is at-least-once, deduped by `client_msg_id` and seq.

## 10. Tips and common mistakes
- Don't promise a global order. Users only see order inside a conversation.
- Don't route through "the" server: with 170 gateways you need a registry, or a hash with its
  trade-offs, and you should say which.
- Push notifications are a hint, not a delivery channel. History comes from the store.
- Separate the send rate (~70k/s) from the delivery rate (~1.2M/s). The second one sizes the
  fan-out tier.
- Say what the ack means: "persisted", not "delivered".

## 11. Learn more
- [Message queues](#/learn/system-design/message-queues) and [sharding](#/learn/system-design/sharding)
- [Load balancing](#/learn/system-design/load-balancing) for long-lived connections
- [Networking basics](#/topic/system-design/networking-basics) and [SQL vs NoSQL](#/topic/system-design/databases-sql-nosql)
- Same shape, bigger audience: [live comments](#/topic/system-design/live-comments)
