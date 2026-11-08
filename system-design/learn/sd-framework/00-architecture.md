## Architecture at a glance

Before the steps, see where they lead. This is the board an interviewer would see at the end of a
45-minute promo-code service interview: scoped, drawn, deep-dived and wrapped up. Marketers
create campaigns, shoppers validate a code in the cart and redeem it at checkout. Play the figure
to walk it in the order you'd present it, then switch the tabs: a Black Friday spike, the code
cache failing, and the interviewer adding "one use per customer" at minute 30.

```figure
system-overview
```

### Zoom in: one deep dive

The deep dive the interviewer usually picks here is "how do you stop a limited code being used
more times than its limit?". Watch the two checkouts both read 9 999 and both write 10 000. Then
try the tabs for the one-statement fix, a payment failing after the redeem, and the token-pool
alternative for very hot codes.

```figure
redeem-race
```

### How it scales

Interviewers push the design with "now 10×" or "now add X". Start from the simple v1 and let each
push name one bottleneck: validate reads (split and cache), one hot code (token pool), then a new
requirement (real-time abuse blocking).

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| How long to scope | 2 min · 5–8 min · 15 min | **5–8 minutes**, ending with numbers | Enough to separate hot reads from contended writes; more steals the deep dives |
| First diagram | the final design · the simplest that works | **Simplest that works**, then evolve | Every later box has a named reason, which is what gets graded |
| Validate vs redeem | one endpoint · two paths | **Two paths**: cached preview, authoritative redeem | Reads are 50× writes and can be stale; redeems must be exact |
| Enforcing the limit | read-then-write · conditional update · token pool | **Conditional update**, token pool for hot codes | One atomic statement prevents oversell; the pool removes the row lock |
| Failed orders | count at redeem · reserve with TTL | **Redeem in the order transaction**, reservation if payment is separate | A use is only spent when the order really completes |
| Which deep dives | whatever you know best · what the numbers say | **Atomic redeem and the hot code** | They carry the correctness risk and the Black Friday number |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Scope runs long | debating discount types at minute 15 | No time for deep dives or wrap-up | Timebox each step and say "scope is settled, moving on" |
| Boxes without reasons | adding Kafka or shards "for scale" | Reads as over-engineering | Tie every component to a number or requirement from scope |
| Oversell | read-then-write under concurrency | More discounts than the budget allows | Conditional update or atomic pop; never decide in the app |
| Hot code | doorbuster code at 2 000 redeems/s | One row lock serialises checkout | Token pool for flagged codes, rate limits per customer |
| Code leak and bots | code shared publicly, many accounts | Campaign budget drained in minutes | Per-customer limits, fraud signals, real-time block list |
| Late requirement | interviewer adds "one per customer" | Redesign under time pressure | Absorb it at one box and say what does not change |
