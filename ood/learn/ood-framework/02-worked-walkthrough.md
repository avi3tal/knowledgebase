# The flow on a small example: an audio-guide rental desk

A museum rents audio guides at a desk. Visitors pay per rental (adult or child rate; members
rent free), return the device at any desk, and lose their deposit if they don't return it the
same day. Staff see which devices are out.

## 1. Clarify

- **Functional:** rent a device to a visitor; return a device; compute the charge by visitor
  type; mark unreturned devices at closing; list devices currently out.
- **Non-functional:** several desks operate at the same time; a device can't be rented twice.
- **Out of scope:** online pre-booking, device repairs.
- **What varies:** pricing by visitor type (new tiers likely), desk count.

## 2. Core objects

`Visitor` (entity), `VisitorType` (enum: ADULT, CHILD, MEMBER), `Device` (entity, with a
status), `DeviceStatus` (enum), `Rental` (entity: device, visitor, start, deposit),
`PricingPolicy` (varies → interface), `Desk` (actor-facing coordinator), `Inventory` (owns
devices, shared across desks).

## 3. Class diagram

```
 «actor» Staff ──uses──▶ Desk ───────────▶ Inventory 1 ◆──── * Device ──▶ «enum» DeviceStatus
                          │                   │
                          │ creates           │ try_checkout(id) / check_in(id)   (locked)
                          ▼                   │
                       Rental * ─────── 1 Visitor ──▶ «enum» VisitorType
                          │
                          └──▶ «interface» PricingPolicy ◁┄┄ StandardPricing
                                                          ◁┄┄ MemberPricing
```

## 4. Patterns

- `PricingPolicy` is a **Strategy** chosen from `VisitorType` through a small **factory**
  (registry). A new tier is one class and one registry line (OCP).
- `Device` status (AVAILABLE → RENTED → AVAILABLE / LOST) is simple enough for an **enum and a
  transition check**. Full State classes would be YAGNI here, so say that out loud.

## 5. Signatures

```python
class PricingPolicy(Protocol):
    def charge(self, visitor: Visitor) -> Money: ...

class Inventory:
    def try_checkout(self, device_id: str) -> Device | None: ...   # atomic
    def check_in(self, device_id: str) -> None: ...
    def out(self) -> list[Device]: ...

class Desk:
    def __init__(self, inventory: Inventory, pricing: Callable[[VisitorType], PricingPolicy]) -> None: ...
    def rent(self, visitor: Visitor, device_id: str) -> Rental: ...
    def give_back(self, device_id: str) -> Money: ...                # refund deposit
```

## 6. Concurrency and extensibility

- **Shared state:** device status, shared by all desks. **Invariant:** a device is in at most
  one active rental. `Inventory.try_checkout` checks and flips the status under one lock (or a
  per-device lock). Desks never write status directly.
- **Extension walk-through:** "a student tier at half price" means a new `StudentPricing`
  class, one enum value and one registry line. `Desk` doesn't change.
