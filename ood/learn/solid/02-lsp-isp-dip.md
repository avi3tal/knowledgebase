# SOLID: LSP, ISP, DIP

## L: Liskov substitution

Any code written against the base type must keep working with every subtype. A subtype may
**accept more** and **promise more**, never less:

- it must not raise "not supported" for a base method,
- it must not demand stronger preconditions (e.g. "amount must be even"),
- it must not weaken guarantees (returning `None` where the base promised a value).

```python
# before: the classic trap
class Rectangle:
    def set_width(self, w): self.w = w
    def set_height(self, h): self.h = h

class Square(Rectangle):            # a square IS-A rectangle… mathematically
    def set_width(self, w): self.w = self.h = w   # surprises callers that set w then h

def stretch(r: Rectangle):
    r.set_width(4); r.set_height(5)
    assert r.w * r.h == 20          # fails for Square
```

Fixes: don't make `Square` a mutable `Rectangle`. Make both immutable shapes with an
`area()`, or give them a common `Shape` interface. The test is *behavioural*, not taxonomic:
"Is a Square a Rectangle?" is the wrong question. "Can every caller of Rectangle use a Square?"
is the right one.

## I: Interface segregation

Clients shouldn't be forced to depend on methods they don't use.

```python
# before: a fat interface
class Machine(ABC):
    def print(self, doc): ...
    def scan(self) -> bytes: ...
    def fax(self, number, doc): ...

class BasicPrinter(Machine):
    def scan(self): raise NotImplementedError     # forced stub (and an LSP smell)
    def fax(self, n, d): raise NotImplementedError

# after: role interfaces, implement what you can do
class Printer(Protocol):
    def print(self, doc) -> None: ...
class Scanner(Protocol):
    def scan(self) -> bytes: ...

class OfficeMachine:            # implements Printer and Scanner
    ...
```

## D: Dependency inversion

High-level policy (business rules) shouldn't depend on low-level details (SMTP, Postgres, a
vendor SDK). Both depend on an **abstraction owned by the high-level side**.

```python
# before: OrderService builds its own details, so it can't be tested without real email
class OrderService:
    def __init__(self) -> None:
        self.mailer = SmtpMailer("smtp.example.com")

# after: the abstraction is declared by the policy, and details are injected
class Mailer(Protocol):
    def send(self, to: str, body: str) -> None: ...

class OrderService:
    def __init__(self, mailer: Mailer) -> None:
        self.mailer = mailer

service = OrderService(SmtpMailer("smtp.example.com"))   # composition root
test_service = OrderService(FakeMailer())                # tests
```

```
 before:  OrderService ───▶ SmtpMailer

 after:   OrderService ───▶ «interface» Mailer ◁┄┄┄ SmtpMailer
                                                ◁┄┄┄ FakeMailer
```

The arrow from the detail now points *up* to the abstraction. That's the "inversion".
