# OOP fundamentals

> Fundamentals · Encapsulation, abstraction, inheritance vs composition, polymorphism

Every OOD answer is built from four ideas. Interviewers rarely ask for the definitions. They
watch whether your classes *use* them: data is hidden behind behaviour, callers depend on
abstractions, and new variants slot in without `isinstance` checks.

| Idea | One-line meaning | How it shows in a design |
|---|---|---|
| Encapsulation | an object guards its own state; the outside only calls methods | no public mutable fields; invariants enforced in methods |
| Abstraction | expose *what*, hide *how* | interfaces / abstract base classes in the diagram |
| Inheritance | IS-A reuse of interface (and sometimes code) | shallow hierarchies that obey LSP |
| Polymorphism | one call, many behaviours, chosen by the object's class | loops over `list[Shape]` calling `area()` |

## Encapsulation: protect the invariant

Before: anyone can break the account.

```python
class Account:
    def __init__(self) -> None:
        self.balance = 0            # public: callers do acc.balance -= 500

acc.balance -= 500                  # overdraft, no record, no rule
```

After: state is private, changes go through methods that keep the rule.

```python
class Account:
    def __init__(self) -> None:
        self._balance = 0
        self._ledger: list[int] = []

    @property
    def balance(self) -> int:       # read-only view
        return self._balance

    def withdraw(self, amount: int) -> None:
        if amount <= 0 or amount > self._balance:
            raise ValueError("invalid amount")
        self._balance -= amount
        self._ledger.append(-amount)
```

Python has no `private` keyword. The `_name` convention plus read-only properties is how you
show intent. Getters and setters for every field are *not* encapsulation. Methods should
express domain actions (`withdraw`), not field access (`set_balance`).

## Abstraction: depend on the "what"

```python
class Notifier(ABC):
    @abstractmethod
    def send(self, user_id: str, text: str) -> None: ...
```

The order service calls `notifier.send(...)`. Whether that's SMTP, a push SDK or a test
double is hidden. In a class diagram, abstractions are the `«interface»` / `«abstract»` boxes
that concrete classes point to.

## Class vs object, and what goes where

- **Class** = the blueprint (fields + methods). **Object** = one instance with its own state.
- **Class attributes** are shared by all instances (constants, counters). **Instance
  attributes** are per object. A mutable class attribute (`items = []` in the class body) is
  shared by accident, which is a classic Python bug.
- **`@classmethod`** gives you alternative constructors (`Money.from_str("3.50 EUR")`).
  **`@staticmethod`** is a helper that needs neither the class nor an instance. It often
  belongs in a module function instead.
