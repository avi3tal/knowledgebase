# SOLID: SRP and OCP

> Fundamentals · five principles that keep classes small, extensible and testable

SOLID isn't a checklist to recite. Each letter names a **smell** you can point at in a design
and a **standard fix**. Interviewers listen for the smell → fix reasoning.

| | Principle | Smell | Fix |
|---|---|---|---|
| S | Single responsibility | one class changes for unrelated reasons | split by reason to change |
| O | Open/closed | new variant = edit an `if/elif` in old code | interface + new class |
| L | Liskov substitution | subclass breaks what callers rely on | fix the hierarchy, or compose |
| I | Interface segregation | implementers stub methods they don't need | smaller, role-based interfaces |
| D | Dependency inversion | high-level code constructs low-level details | depend on abstractions, inject them |

## S: Single responsibility

"One reason to change" means one *actor* or concern that would ask for the change. It does not
mean one method.

```python
# before: pricing, persistence and formatting change for three different people
class Invoice:
    def total(self) -> int: ...
    def save(self, db) -> None: ...
    def to_pdf(self) -> bytes: ...

# after
class Invoice:                     # domain rules (finance asks for changes)
    def total(self) -> int: ...
class InvoiceRepository:           # storage (the platform team)
    def save(self, inv: Invoice) -> None: ...
class InvoicePdf:                  # presentation (design asks for changes)
    def render(self, inv: Invoice) -> bytes: ...
```

**Don't overdo it:** splitting a 20-line class into five one-method classes hurts cohesion.
Split when the reasons to change are real and separate.

## O: Open for extension, closed for modification

```python
# before: every new vehicle type edits this method
def fee(vehicle, hours):
    if vehicle.kind == "car": return 2 * hours
    if vehicle.kind == "truck": return 5 * hours
    if vehicle.kind == "bike": return 1 * hours

# after: new types extend, old code stays untouched
class FeeRule(Protocol):
    def fee(self, hours: int) -> int: ...

class CarFee:
    def fee(self, hours: int) -> int:
        return 2 * hours

RULES: dict[str, FeeRule] = {"car": CarFee(), "truck": TruckFee(), "bike": BikeFee()}

def fee(kind: str, hours: int) -> int:
    return RULES[kind].fee(hours)
```

OCP is the principle behind Strategy, factories with registries, Observer and Decorator. The
pattern lessons show the mechanics. **YAGNI applies:** add the extension point where variation
is likely, not everywhere.
