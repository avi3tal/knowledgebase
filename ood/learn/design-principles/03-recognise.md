# Recognising which principle is at stake

| Smell in the design | Principle |
|---|---|
| the same rule or formula in two places | **DRY** |
| a plugin framework / generic layer for a requirement nobody stated | **YAGNI** / **KISS** |
| subclasses multiplying along two axes; behaviour must change at runtime | **composition over inheritance** |
| `a.b.c.d.do()`; controllers reaching deep into domain objects | **Law of Demeter** ("tell, don't ask") |
| a class with unrelated responsibilities | low **cohesion** (and SRP in SOLID) |

## Look-alikes (anti-signals)

- **One class with several reasons to change** → that's **SRP**, filed under **SOLID**.
  Cohesion is the general idea, and SOLID is the named rule interviewers expect.
- **A subclass that throws "not supported" for a parent method** → **LSP** (SOLID). The fix is
  often composition, but the violated principle is LSP.
- **A specific recipe for swapping behaviour** (interface + concrete classes) → that's the
  **Strategy pattern** (behavioral). Composition over inheritance is the principle behind it.
- **Encapsulation broken by public fields** → OOP basics. Demeter is about *call chains*
  across objects, not field visibility.

## Interview pitfalls

- **Quoting acronyms without trade-offs.** "DRY" earns credit only when you also say when you
  would *not* deduplicate.
- **YAGNI as an excuse for no seams.** Leave an interface where change is *likely* (payment
  methods, pricing rules), and skip it where it isn't.
- **Inheritance for code reuse only.** `Stack(list)` exposes `insert(0, x)` and breaks the
  stack contract. Hold a list instead.
