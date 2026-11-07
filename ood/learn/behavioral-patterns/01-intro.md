# Behavioral patterns

> Design patterns · Strategy, Observer, State, Command, Chain of Responsibility, Template Method

Creational patterns decide **who builds** an object. Structural patterns decide **how objects are
wired together**. Behavioral patterns decide **who does what at runtime**: which object makes a
decision, who gets told when something happens, and how a request travels until something
handles it.

All six patterns below do the same basic thing. They take behaviour that would sit in a long
`if/elif` chain or a hard-coded call and **move it into an object you can swap, add or queue**.

| Pattern | What varies | Smell it removes |
|---|---|---|
| Strategy | *how* one step is done (an algorithm) | `if mode == "a": … elif mode == "b": …` inside one method |
| Observer | *who* reacts to an event | the publisher calls `email.send()`, `sms.send()`, `audit.log()` by name |
| State | what an object does *in its current phase* | every method begins with `if self.status == …` |
| Command | *when / whether* an action runs (queue, undo, log) | actions run right away and cannot be undone or replayed |
| Chain of responsibility | *which* handler deals with a request | one big validator that knows every rule |
| Template method | the *steps* of a fixed algorithm | copy-pasted methods that differ in one or two lines |

## Strategy in one picture

```
 ┌──────────────┐  uses   ┌────────────────────┐
 │ Checkout     │────────▶│ «interface»        │
 │──────────────│         │ DiscountPolicy     │
 │ policy       │         │ apply(total) → int │
 │ total()      │         └─────────▲──────────┘
 └──────────────┘          ┌────────┼─────────┐
                     NoDiscount  PercentOff  BuyTwoGetOne
```

Before: the algorithm and the decision about which one to use are tangled together.

```python
class Checkout:
    def total(self, items, mode):
        subtotal = sum(i.price for i in items)
        if mode == "percent":
            return subtotal * 90 // 100
        elif mode == "b2g1":
            ...  # every new promotion edits this method
        return subtotal
```

After: each algorithm sits in its own class, and the caller picks one.

```python
class DiscountPolicy(Protocol):
    def apply(self, subtotal: int) -> int: ...

class PercentOff:
    def __init__(self, pct: int) -> None:
        self.pct = pct
    def apply(self, subtotal: int) -> int:
        return subtotal * (100 - self.pct) // 100

class Checkout:
    def __init__(self, policy: DiscountPolicy) -> None:
        self.policy = policy             # injected, swappable at runtime
    def total(self, items) -> int:
        return self.policy.apply(sum(i.price for i in items))
```

The *Design principles* lesson animates a strategy being swapped at runtime.

**In Python** a strategy is often just a function (`Callable[[int], int]`). Use a class when the
strategy has its own configuration or state, or when several methods belong together.
