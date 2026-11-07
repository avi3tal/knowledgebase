# Composition over inheritance, Law of Demeter

## Composition over inheritance

Inheritance says **IS-A** and is fixed when you write the class. Composition says **HAS-A**
and can change at runtime. Prefer composition when:

- variation happens along **more than one axis** (channel × urgency, shape × colour). Subclasses
  multiply as a product of the axes, while composed parts only add up;
- the behaviour must **change at runtime** (switch pricing rule mid-session);
- you want to reuse code from a class whose *interface* you don't want to expose.

```
 inheritance (fixed, explodes)          composition (swappable)

        Shipper                         Shipper ◇──── policy: ShippingPolicy
   ┌──────┼────────┐                                       ▲
 Weight  Flat  FreeOver5              ByWeight   Flat   FreeOverFive
 Shipper Shipper Shipper
```

```python
# before: to change the rule you must replace the shipper object
class FlatShipper(Shipper):
    def quote(self, kg): return 10

# after: Shipper has a policy and delegates
class Shipper:
    def __init__(self, policy: ShippingPolicy) -> None:
        self.policy = policy
    def quote(self, kg: int) -> int:
        return self.policy.cost(kg)
```

Step through the trace below. The same `Shipper` quotes 3 kg under three different policies,
and `quote()` never checks which policy it holds. (This is also the Strategy pattern. The
principle is *why* it works.)

**When inheritance is right:** a true IS-A relation that obeys **LSP** (a `SavingsAccount` really
can be used wherever an `Account` is expected), a shallow hierarchy, and shared behaviour that
doesn't vary independently. An abstract base with a template method is fine.

## Law of Demeter ("talk to friends, not strangers")

A method should only call methods on: itself, its parameters, objects it creates, and its own
fields. Not on objects *returned by* those calls.

```python
# before: the controller knows the inside of Order, Customer and Wallet
order.customer.wallet.balance -= order.total()

# after: ask the object that owns the rule
order.charge()            # Order → self.customer.pay(self.total()) → Wallet.debit(...)
```

Chains like `a.b().c().d()` mean that a change in `C` breaks code three classes away. Fix:
**"tell, don't ask"**. Move the behaviour to the object that has the data.

*Not* a violation: fluent builders and value chains (`text.strip().lower()`,
`builder.to(x).subject(y)`), because each call returns the same kind of object or a plain value.
