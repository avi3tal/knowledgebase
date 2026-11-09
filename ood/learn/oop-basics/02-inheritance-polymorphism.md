# Inheritance, composition and polymorphism

## Polymorphism removes type switches

Before: the payroll asks every worker what it is.

```python
for w in team:
    if w.kind == "salaried":
        amount = w.monthly
    elif w.kind == "hourly":
        amount = w.hours * w.rate
    elif w.kind == "contractor":
        amount = w.invoice
    # a new kind means editing every loop like this one
```

After: each class carries its own rule, and the loop makes one call.

```figure
worker-hierarchy
```

```python
for w in team:
    amount = w.pay()        # dispatch picks Salaried.pay / Hourly.pay / Contractor.pay
```

In the trace, watch the call stack. The same line `worker.pay()` enters a different `pay` each
time, and the loop never inspects the class.

**Python note:** dispatch works on any object with the method (**duck typing**). `ABC` and
`typing.Protocol` make the contract explicit, and you should draw them in the diagram.

## Inheritance vs composition

| | Inheritance (IS-A) | Composition (HAS-A) |
|---|---|---|
| Coupling | tight: subclass sees parent internals | loose: only the public interface |
| Change at runtime | no | yes (swap the part) |
| Combinations | multiply (2 axes → n×m classes) | add (n + m parts) |
| Good for | a stable "kind of" relation that obeys LSP | behaviours that vary, reuse without exposing an API |

Rule of thumb for interviews: **inherit to share an interface, compose to share behaviour.**
The *Design principles* lesson shows composition with a swappable policy.

## Abstract class vs interface

- **Interface** (`Protocol`, or an ABC with only abstract methods): a pure contract, no state.
  A class can implement many.
- **Abstract class**: a partial implementation plus abstract hooks (shared fields, template
  methods). Single inheritance in most languages.

Use an interface where callers depend on a capability (`Payable`, `Notifier`). Use an
abstract class where siblings genuinely share state or a fixed algorithm (`Worker.name`, a
`Report.render()` skeleton).
