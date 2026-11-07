# Designing thread-safe classes

## Where does the lock live?

**Inside the object that owns the invariant.** Callers shouldn't have to remember to lock.

```python
# before: every caller must lock correctly, and one forgets
if inventory.stock[sku] > 0:          # check
    inventory.stock[sku] -= 1         # act — another thread sold the last one in between

# after: check-then-act is one method, guarded inside
class Inventory:
    def __init__(self) -> None:
        self._stock: dict[str, int] = {}
        self._lock = threading.Lock()

    def try_reserve(self, sku: str) -> bool:
        with self._lock:
            if self._stock.get(sku, 0) == 0:
                return False
            self._stock[sku] -= 1
            return True
```

The API change matters as much as the lock. `has_stock()` followed by `reserve()` can never be
made safe from the outside. `try_reserve()` can.

## Toolbox (pick the smallest that works)

| Tool | Use when |
|---|---|
| **Immutability** | Value objects (`Money`, `Coordinate`): nothing to protect. Use `@dataclass(frozen=True)`. |
| **Confinement** | Only one thread ever touches the object (an actor or a single worker owns it). |
| **Lock / mutex** | A few fields change together. Keep the critical section short, with no I/O inside. |
| **Read-write lock** | Many readers, rare writers (a config, a catalog). |
| **Condition variable** | A thread must *wait until* some state holds (buffer not empty). |
| **Atomic / CAS** | A single counter or flag. Go has `sync/atomic`; Python has no direct equivalent, so use a lock. |
| **Optimistic version check** | Contention is rare: read the version, write if the version is unchanged, else retry (the same idea as a DB row version). |
| **Per-entity locks / striping** | One global lock is a bottleneck. Lock per seat, per account or per bucket. |

## Deadlock in one sentence

Two threads each hold one lock and wait for the other's. Prevent it by **always acquiring
locks in a fixed global order** (e.g. by account id when transferring between two accounts), by
using timeouts, or by never holding a lock while calling out to code you don't control.

## Interview pitfalls

- **"I'll make it synchronized" everywhere.** A lock on every method of every class serializes
  the whole system. Lock the smallest invariant.
- **Locking the wrong object.** A lock on `Seat` doesn't protect "the user books at most 2
  seats". That invariant lives on the `User`/`Booking` level.
- **I/O inside a critical section** (payment call while holding the seat lock). Reserve the seat
  with a short hold and expiry, release the lock, then call payment.
- **Singleton init races.** Lazy `if cls._instance is None:` without a lock creates two
  instances. Use module-level instances or a lock. See the *Creational patterns* lesson.
- **Observers called under a lock.** A listener that calls back into the subject can deadlock.
  Copy the subscriber list under the lock, then notify outside it.
