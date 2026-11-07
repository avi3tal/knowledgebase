# Design principles beyond SOLID

> Fundamentals · DRY, KISS, YAGNI, composition over inheritance, Law of Demeter, plus cohesion/coupling

SOLID tells you how to shape classes. These principles are broader rules of thumb. Interviewers
use them to judge whether your design is **proportionate**: no copy-paste, but also no
framework built for a two-class problem.

## DRY: Don't Repeat Yourself

Every piece of *knowledge* (a rule, a formula, a constant) should live in exactly one place.

```python
# before: the late-fee rule lives in two places and will drift
class Invoice:
    def total(self): return self.amount + max(0, self.days_late) * 2
class Reminder:
    def text(self, inv): return f"you owe {inv.amount + max(0, inv.days_late) * 2}"

# after
class Invoice:
    def late_fee(self) -> int:
        return max(0, self.days_late) * 2
    def total(self) -> int:
        return self.amount + self.late_fee()
```

**Careful:** DRY is about duplicated *knowledge*, not similar-looking code. Two functions that
look alike today but change for different reasons should stay separate. Merging them couples
two unrelated rules (the "wrong abstraction").

## KISS: Keep It Simple

Pick the simplest design that meets the stated requirements. An `Enum` plus a dict often beats
a class hierarchy. A list scan often beats an index for 50 items. Simple designs are easier to
explain in 45 minutes, and interviewers notice.

## YAGNI: You Aren't Gonna Need It

Don't build for requirements nobody stated. The interview version: **design the seams, don't
build the rooms**. Say "payment is behind a `PaymentGateway` interface, so adding PayPal later is
one class", then implement only the card gateway.

| Over-engineering signal | Simpler alternative |
|---|---|
| Abstract factory with one family | a constructor call or a simple factory |
| Plugin system for 2 fixed variants | an `if` or a dict, extracted when a 3rd appears |
| Generic `Repository[T]` for one entity | one concrete class |
| Events and a bus where one direct call is enough | the direct call |

## Cohesion and coupling

- **High cohesion:** everything in a class serves one purpose (`Ticket` knows about its
  timestamps and fee, not about printing receipts).
- **Low coupling:** a class knows as little as possible about others. It depends on
  interfaces, and it doesn't reach through objects (see Law of Demeter).

Most principles in this lesson and in SOLID are ways to raise cohesion and lower coupling.
