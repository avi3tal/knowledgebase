# Design a distributed message queue (Kafka)

> Difficulty: **hard** · Topics: distributed message queue, replication, consensus, sharding · ~60 min

Design the backbone that services use to pass events to each other, like Kafka or a cloud
Pub/Sub. Producers publish messages to named topics. Many independent applications read them,
each at its own pace, and can go back and re-read. The system runs on a cluster of ordinary
machines that fail.

## What the interviewer tells you if you ask
- About **1 million messages per second** at peak (about **300,000/s** on average). An average
  message is **~1 KB**.
- Roughly **2,000 topics**. On average each message is read by **3 different applications**, and
  each application runs many instances.
- Messages with the same key (for example, one order id) must be read **in the order they were
  written**. Nobody needs a global order across keys.
- Once the system says "got it", the message must survive the loss of **any one machine, or a
  whole availability zone**.
- Publishing should take **under ~10 ms** at p99 in-region, and readers should see a message
  within **~100 ms**.
- Data is kept **7 days** by default. Some topics only need the **latest value per key**, kept
  indefinitely.
- An application that shipped a bug must be able to **re-read yesterday's messages**.
- Each machine has about **20 TB** of usable disk and a **10 Gbps** network card.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(the log, replication, consumers, retention…). Solve each part on its own: options, choice and a
small diagram. Then **reduce** them into one high-level design (v1 → … → v5), followed by deep
dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then hint, and
*show* only as a last resort.

## Things worth deciding (no answers here)
- What data structure lets you write 1 GB/s and let three applications read it at different
  positions?
- What exactly does "got it" mean, and what happens if the machine that said it dies a second
  later?
- Who decides which machine is in charge of a piece of data, and how do you stop two from thinking
  they are?
- Ten instances of one application read a topic. How do they split it, and where do they resume
  after a restart?
- If nothing is deleted when it is read, when is anything deleted?
