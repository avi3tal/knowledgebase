# Builder and Singleton

## Builder

A constructor with eight parameters, five of them optional, is hard to read at the call site
(`Email("a@x", None, None, "hi", [], True, ...)`). Rules like "either `to` or `bcc` is
required" also end up checked in odd places. A builder:

- collects parts one call at a time (often as a fluent chain that returns `self`),
- **validates once** in `build()`,
- returns an **immutable**, always-valid product.

```python
email = (EmailBuilder()
         .to("ana@example.com")
         .cc("ben@example.com")
         .subject("Q3 numbers")
         .build())
```

```figure
builder-flow
```

In the trace, the map shows `builder.parts` filling up. No `Email` exists until `build()`. The
checks also confirm that a builder missing required parts raises instead of returning a broken
object.

**When not to use it in Python:** keyword arguments with defaults plus `@dataclass(frozen=True)`
already solve "many optional parameters". Use a builder when construction has **steps, repeated
parts or cross-field validation**, or when the product is assembled in stages by different code.

## Singleton (and why interviewers are suspicious of it)

Singleton guarantees one instance and a global access point. The problems:

- It is **global mutable state** with a nicer name. Tests leak state into each other.
- It **hides dependencies**. `Logger.instance()` deep inside a method doesn't appear in any
  signature, which breaks DIP.
- **Lazy initialisation races.** `if cls._instance is None: cls._instance = cls()` can create
  two instances under threads (see *Concurrency in LLD*).

Better options, in order:

1. **Create one instance at the composition root and pass it in** (dependency injection). The
   class itself isn't special.
2. **A module-level instance** (`config = Config.load()`). Python modules are imported once,
   so this is a thread-safe singleton for free.
3. A classic singleton only when "exactly one" is a hard **domain** rule (one physical device
   driver per port), with thread-safe init.

```python
import threading

class DeviceDriver:
    _instance: "DeviceDriver | None" = None
    _lock = threading.Lock()

    @classmethod
    def instance(cls) -> "DeviceDriver":
        if cls._instance is None:              # fast path, no lock
            with cls._lock:
                if cls._instance is None:      # re-check under the lock
                    cls._instance = cls()
        return cls._instance
```

**Interview line:** "I'd make it a single instance created at start-up and injected, rather than
a Singleton class, so it stays testable."
