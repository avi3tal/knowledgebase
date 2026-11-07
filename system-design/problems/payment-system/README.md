# Design a payment system

> Difficulty: **hard** · Topics: payment system, distributed transactions, event streaming, databases · ~60 min

Design a payment platform like Stripe. Merchants call your API to charge their customers. You pass
the charge to an external card processor (a PSP), keep track of every payment and refund, record who
owes whom, and pay merchants out later.

## What the interviewer tells you if you ask
- About **10 million payments per day**, with peaks of **~10×** on days like Black Friday.
- The processor takes **1–3 seconds** per call. It sometimes fails, and sometimes times out without
  telling you whether the card was charged.
- Merchants retry on timeouts, and so do you. A customer must **never be charged twice**.
- Finance must be able to explain every balance **to the cent**. Records are kept for **7 years**.
- The processor sends webhooks, and once a day it sends a **settlement report** of what it actually
  moved.
- Card numbers are tokenized by the processor: you never see or store them. Fraud scoring and
  currency conversion are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(retry safety, the processor integration, bookkeeping, reconciliation…). Solve each part on its
own: options, choice and a small diagram. Then **reduce** them into one high-level design (v1 → v2
→ …), followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge
first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- A merchant retries `POST /payments` after a timeout. How do you recognise it, and what do you
  return?
- The processor times out. Was the customer charged? What do you do next, and what must you never do?
- Is a `balance` column enough to answer finance's questions? If not, what do you store?
- The payment row commits, then your process crashes before anything else is told. What is lost?
- How would you find out that your records and the processor's disagree, and who wins?
- Which part of this system may be eventually consistent, and which may not?
