## How to recognise you need it

**Strong signals:**
- "The user doesn't need to wait for it": emails, notifications, thumbnails, transcoding,
  reports.
- **Bursty** producers against slower or fixed-capacity consumers.
- One event must trigger **several** independent downstream actions (fan-out).
- Downstream services are flaky or slow, and you need retries without blocking the request.
- You need a durable record of events to replay or feed analytics (log / stream).

**Look-alikes, and why they're different:**
- **Load balancing** spreads requests **synchronously** across servers that answer now. A
  queue lets consumers pull **later**.
- **Rate limiting** rejects excess work. A queue **keeps** it and processes it eventually.
- **Stream processing** is the computation **on top of** a log: windows, joins, aggregations
  over events in motion. The queue or log is the transport.
- **Microservices** communication is the broader decision of sync vs async between services.
  A queue is the async half of it.

**Interview pitfalls:**
- Adding a queue to a path where the user needs the answer **now** (a read, a balance check).
- Claiming exactly-once without an idempotency key in the consumer.
- No DLQ and no story for poison messages.
- Assuming global ordering. Logs order only **within a partition**, so choose the partition
  key (e.g. `order_id`) for the ordering you actually need.
- Not monitoring **consumer lag**, the first sign that the system is falling behind.
