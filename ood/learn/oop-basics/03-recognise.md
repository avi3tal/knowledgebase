# Recognising OOP-basics issues

| Smell | Missing idea |
|---|---|
| public fields mutated from outside; invariants checked in callers | **Encapsulation** |
| `if obj.type == ...` / `isinstance` chains in business logic | **Polymorphism** |
| callers construct and call concrete vendor classes everywhere | **Abstraction** (interface + DI) |
| deep hierarchies (5 levels), subclasses overriding to "do nothing" | inheritance misuse → composition |
| class with only getters/setters, logic lives in a `Manager` | anaemic model: move behaviour onto the data |

## Look-alikes (anti-signals)

- **A subclass that breaks the parent's contract** (throws, ignores input) is LSP, filed under
  **SOLID**. OOP basics says inheritance exists. SOLID says when it's *correct*.
- **"Which concrete class do I create?"** is a **creational** question (factory). Polymorphism
  starts after the object exists.
- **Many subclasses along two axes** → **composition over inheritance** (design principles).
- **Shared state touched by several threads** → **concurrency**, even if it's well
  encapsulated. A private field is still racy.

## Interview pitfalls

- **Nouns-to-classes on autopilot.** Not every noun is a class. `Color` or `Status` is usually
  an `Enum`. `Address` is a value object. Behaviour decides classes.
- **Getters/setters for everything.** Show domain methods (`ticket.close(paid_at)`), not
  `set_status("closed")`.
- **Inheritance for code reuse.** `class Manager(Employee, Database)` gets a raised eyebrow.
- **Forgetting identity vs value.** Two `Money(5, "EUR")` are equal (value object, implement
  `__eq__`/`__hash__`, make it frozen). Two `User`s with the same name aren't (entity, compare
  by id).
