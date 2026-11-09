# Observer and State

## Observer: "tell everyone who cares"

A **subject** keeps a list of **observers** and calls the same method on each of them when
something happens. The subject only knows the observer *interface*. It does not know about
email, push or audit logs.

```figure
observer-classes
```

Before:

```python
def publish(self, ticker, price):
    self.push.send(ticker, price)      # adding SMS means editing the feed
    self.email.queue(ticker, price)
```

After: the feed only loops over its subscribers (`for w in self.subscribers[t]: w.notify(t, price)`).

Step through it below. Watch the subscriber map change on `sub`/`unsub`, and the call stack go
`publish → notify` once per observer.

**Pitfalls interviewers probe:**
- **Mutating the list while notifying.** An observer that unsubscribes inside `notify` can skip
  its neighbour. Iterate over a copy, as the example does.
- **Memory leaks.** A subject that holds strong references keeps dead observers alive. Make
  unsubscribe explicit, or use weak references.
- **Ordering and failures.** If one observer raises, do the rest still run? Say what you do:
  catch and log per observer, or deliver through a queue.
- **Sync vs async.** In-process observers are synchronous. Across services the same idea becomes
  pub/sub on a message broker.

## State: "the object behaves differently in each phase"

When every method begins with `if self.status == "draft": … elif self.status == "review": …`,
the rules for one status end up spread across many methods. State turns each status into a
class. The **context** (`Document`) holds the current state object and delegates to it.

```figure
state-classes
```

```figure
state-transitions
```

Each state returns the next state, so the transition table lives in the states. In the trace,
`approve` on a draft is ignored, and `reject` sends review back to draft.

**State vs Strategy.** The class diagrams look the same: a context plus an interface with
several implementations. The difference is **who changes it**. A strategy is chosen *from the
outside* (config, user, caller) and usually stays put. A state *replaces itself* as events
arrive. If the object has a lifecycle with legal and illegal transitions, it is State.

**When not to use State:** two or three statuses with one method that cares → an `Enum` plus a
transition dict (`{(DRAFT, "submit"): REVIEW, …}`) is shorter and easier to test. Reach for
state classes when *several* behaviours differ per state.
