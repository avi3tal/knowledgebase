# Practising the flow in the studio's design console

OOD practice problems open in the design console, the same one used for system design. For
OOD it shows six stages (no estimates). Each interview step maps to one of them:

| Interview step | Console stage | What you fill in | What the deterministic checks read |
|---|---|---|---|
| 1. Clarify | **scope** | functional, non-functional, assumptions, out-of-scope bullets | `requirement` checks: keywords in any scope item |
| 2. Core objects | **api** | the *data* rows: one per core entity / value object / enum (name, fields, why); optional api rows for key public operations | `entity` checks: keywords in a data row |
| 3. Class diagram | **high-level** | the diagram: nodes of kind `actor`, `class`, `abstract`, `interface`, `enum` and labelled edges; save a new **version** each time the design changes, with a `why` | `component` and `edge` checks (e.g. a class → interface edge) on the **final** version; smells flag an orphan class or an interface nothing implements |
| 4. Patterns (why this one?) | **deep-dives** | one card per decision: options with pros/cons, the choice, and why | `decision` checks: the topic is discussed *and* a choice + why are given |
| 5. Code signatures | **signatures** | `signatures.py`: classes and method signatures (bodies optional) | `signature` checks: names like `Lot`, `Lot.park` (method on that class) or `LRUCache(Cache)` (base class) |
| 6. Concurrency & extensibility | **wrap-up** | bottlenecks, failures, scale (concurrency), future (extensibility) | `wrapup` checks: the answer is written |

## How to use it well

- **Patterns live in the diagram.** A Strategy is an `interface` node with two or more `class`
  nodes pointing at it, plus the context class holding it. Name it in the version `why`:
  "v2: pricing varies by visitor type → `PricingPolicy` interface (Strategy, OCP)".
- **Evolve in versions.** v1 = core objects and relationships. v2 = the extension points. v3 =
  the concurrency fix (which class owns the lock). The console diffs consecutive versions, which
  mirrors how you'd talk through the design.
- **Labels don't give the answer away.** The check labels you see before submitting describe
  *what* is expected ("pricing can vary without editing the desk"), not *how*. Tips come in
  three levels (nudge → hint → show) if you're stuck. Each tip used is recorded.
- **After submitting**, the reference walkthrough unlocks. Compare your diagram versions with
  it, then ask `/review` for tutor feedback.
