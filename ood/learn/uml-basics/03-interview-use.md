# Using diagrams in the interview

## How much UML is enough

- **Class diagram first**: 5–10 boxes, the key fields and methods, relationships with
  multiplicity. Skip trivial getters.
- **Mark the abstractions**: `«interface»` and `«abstract»` boxes are where your patterns and
  extensibility live. Interviewers look for them.
- **One sequence diagram** for the main flow, and a second one only if a failure path is
  interesting (payment declined, timeout, concurrent booking).
- **Iterate in versions.** The studio's design console keeps diagram versions with a `why`.
  Use it the way you'd talk: "v2 adds a `PricingStrategy` interface because rates differ per
  vehicle type".

## Mapping diagram → code

| Diagram | Python |
|---|---|
| `«interface» Notifier` | `class Notifier(Protocol)` or an ABC with abstract methods |
| `A ───▷ B` | `class A(B)` |
| `A ┄┄▷ «interface» I` | `class A` that implements `I`'s methods (optionally `class A(I)`) |
| `A ◆── * B` | `A.__init__` creates the Bs, `self._bs: list[B]` |
| `A ◇── * B` | `A.add(b: B)` receives existing Bs |
| `A ┄┄> B` | `B` is only a parameter or local inside one of A's methods |
| `A ── 0..1 B` | `self.b: B \| None` |
| `«enum» Size` | `class Size(Enum)` |

## Pitfalls

- **Arrows without meaning.** Every line needs a direction and a multiplicity, or a label
  ("assigns", "pays with").
- **Inheritance everywhere.** If most of your lines are triangles, revisit composition.
- **Composition diamond on the wrong end.** The diamond touches the *owner*.
- **Database tables drawn as classes.** A class diagram shows behaviour and ownership, not
  foreign keys. `OrderLine` holds a `Product` reference, not a `product_id` column.
- **Spending 20 minutes on notation.** Clarity beats UML completeness. Say "dashed means
  return" and move on.
