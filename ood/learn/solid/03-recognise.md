# Recognising SOLID issues

| You see… | Letter |
|---|---|
| "this class handles X, Y and Z" (persistence + rules + formatting) | **S** |
| a new type / rule / channel means editing a switch in existing code | **O** |
| a subclass that throws, no-ops, or tightens input rules for a parent method | **L** |
| implementers stubbing interface methods; clients importing methods they don't call | **I** |
| `self.x = ConcreteThing()` inside business classes; tests need a real DB / network | **D** |

## Look-alikes (anti-signals)

- **"Which pattern implements the fix?"** → that's a **pattern** question. OCP is the
  principle; Strategy (behavioral), Decorator (structural) or a factory (creational) is the
  mechanism. Read the question: principle or recipe?
- **Duplication, over-engineering, call chains** → **design principles** (DRY, YAGNI, Demeter),
  not SOLID.
- **Public fields mutated from outside** → **encapsulation** (OOP basics). SRP is about
  *reasons to change*, not visibility.
- **Global `get_instance()` everywhere** is a creational choice (Singleton), but the *harm*
  it causes (hidden dependencies, untestable) is DIP.

## Interview pitfalls

- **Reciting definitions.** Instead, point at your own diagram: "`ParkingLot` was doing fee
  calculation too, so I pulled it out to a `FeeCalculator` (SRP), behind an interface so new
  vehicle types plug in (OCP)."
- **ISP ≠ one method per interface.** Group by client role.
- **DIP ≠ "use a DI framework".** Passing the dependency into the constructor is enough.
- **LSP via `isinstance` checks in callers** ("if it's a Square, do this instead") means the
  hierarchy is wrong.
