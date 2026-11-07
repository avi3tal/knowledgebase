# Recognising creational patterns

| You hear… | Reach for |
|---|---|
| "create a X, Y or Z depending on type / config / extension; more types later" | **Factory with registry** |
| "the base workflow is fixed, subclasses decide which product they work with" | **Factory method** |
| "a set of objects that must belong together (theme, cloud provider, DB dialect)" | **Abstract factory** |
| "many optional fields", "assembled in steps", "must be valid before use", "immutable" | **Builder** |
| "exactly one per process, shared by everyone" | **Singleton**, or better a single injected instance |

## Look-alikes (anti-signals)

- **Choosing *behaviour* after the object exists** (pricing rule, sort order) → **Strategy**
  (behavioral). A factory may *create* the strategy, but the variation is behaviour.
- **Converting an existing object to another interface** → **Adapter** (structural). Nothing
  new is being constructed.
- **Lazy creation behind the same interface** (load the big image on first draw) → **virtual
  Proxy** (structural). The caller already holds an object.
- **"Why is this class so hard to test?" when it calls `Database()` in its constructor** →
  a **SOLID** (DIP) conversation first: inject the dependency.

## Interview pitfalls

- **Factory with a growing `if/elif`.** That's the same smell moved somewhere else. Use a
  registry so new types don't edit the factory.
- **Builder that returns a mutable product**, or that skips validation. Then why have a builder?
- **Defaulting to Singleton for "managers"** (`ParkingManager.get_instance()`). Prefer passing
  one instance around. Explain the testing and hidden-dependency costs if you keep it.
- **Abstract factory for one product.** If there's no family, a simple factory is enough.
