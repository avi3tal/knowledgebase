# Structural patterns

> Design patterns · Adapter, Decorator, Facade, Composite, Proxy

Structural patterns are about **wiring**: how objects hold and wrap each other so that callers
see a simpler or more uniform interface. Almost all of them rely on the same move: **an object
that holds another object and forwards calls to it**. What differs is *why* it forwards.

| Pattern | Wrapper's interface vs wrapped | Purpose |
|---|---|---|
| Adapter | **different** → converts to what the caller expects | make an incompatible class fit |
| Decorator | **same** | add behaviour, stackable |
| Proxy | **same** | control access: lazy load, cache, auth, remote |
| Facade | **new, simpler**, over *many* objects | hide a subsystem behind one entry point |
| Composite | **same** for leaf and group | treat a tree of objects like one object |

## Adapter: make it fit

You own an interface (`PaymentGateway.charge(amount_cents)`). A vendor SDK offers
`make_payment(amount: Decimal, currency: str)`. Don't spread vendor calls through your code.
Write one adapter.

```
 Checkout ──▶ «interface» PaymentGateway ◁── VendorPayAdapter ──▶ VendorSDK
                charge(cents)                 charge(cents):
                                                sdk.make_payment(cents / 100, "EUR")
```

```python
class VendorPayAdapter:                       # implements PaymentGateway
    def __init__(self, sdk: VendorSDK) -> None:
        self._sdk = sdk
    def charge(self, cents: int) -> str:
        receipt = self._sdk.make_payment(Decimal(cents) / 100, "EUR")
        return receipt.id                     # translate the result too
```

Swapping vendors now means writing a new adapter. `Checkout` doesn't change, which is OCP and
DIP at work (see SOLID).

## Facade: one door into a subsystem

```python
class OrderFacade:
    def __init__(self, stock: Inventory, pay: PaymentGateway, ship: Shipping, mail: Mailer) -> None:
        ...
    def place(self, cart: Cart) -> OrderId:
        self.stock.reserve(cart)
        receipt = self.pay.charge(cart.total())
        label = self.ship.book(cart.address)
        self.mail.confirm(cart.user, receipt, label)
        return ...
```

The controller calls `place()` and never learns the order of the four subsystem calls. A facade
**doesn't forbid** direct access to the subsystems. It only makes the common path easy.
Watch out: a facade that grows every feature becomes a god object (SRP violation).
