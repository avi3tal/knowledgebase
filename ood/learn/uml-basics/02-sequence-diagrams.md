# Sequence diagrams

A class diagram shows **structure**. A sequence diagram shows **one scenario in time**:
who calls whom, in which order, and what comes back. Use it for the one or two flows that
matter most (checkout, booking, a failure path).

```
  User        Checkout        Inventory      Payment       Mailer
   │ place(mug)  │                │              │             │
   │────────────▶│ reserve(mug)   │              │             │
   │             │───────────────▶│              │             │
   │             │◀ ─ ─ ─ true ─ ─│              │             │
   │             │ charge(mug)                   │             │
   │             │──────────────────────────────▶│             │
   │             │◀ ─ ─ ─ ─ ─ ─ ─ false ─ ─ ─ ─ ─│             │
   │      ┌──────┴─ alt [declined] ──────────────────────┐     │
   │      │      │ release(mug)   │                      │     │
   │      │      │───────────────▶│                      │     │
   │      ├──────┼─ [ok] ─────────┼──────────────────────┤     │
   │      │      │ confirm(mug)                          │     │
   │      │      │────────────────────────────────────────────▶│
   │      └──────┴───────────────────────────────────────┘     │
   │◀─ ─declined─│
```

Notation:

- **Lifelines**: one vertical line per participant (actor or object).
- **Solid arrow**: a synchronous call. **Dashed arrow**: the return value. An **open
  arrowhead** marks an async message (an event, an email queued).
- **Activation bar**: the time a participant is busy handling a call. In the trace below, the
  call stack plays this role: each frame is an active bar.
- **Fragments**: `alt [cond]` (if/else), `opt [cond]` (if), `loop [cond]`.

The trace runs the objects from the diagram with a declined card. Every message a method
receives is appended to `messages`, so the list grows into the sequence diagram line by line,
including the compensating `release` in the declined branch.
