# Recognising behavioral patterns

| You hear… | Reach for |
|---|---|
| "different pricing / routing / ranking / eviction rules, pick one by config" | **Strategy** |
| "when X happens, notify A, B and C, and more listeners later" | **Observer** |
| "it can be idle, active, suspended…, and allowed actions depend on that" | **State** |
| "undo", "redo", "queue jobs", "replay", "log every action" | **Command** |
| "a request passes through checks; any check may stop it or escalate it" | **Chain of responsibility** |
| "same steps in the same order, only one step differs per type" | **Template method** |

## Look-alikes (anti-signals)

- **Adding responsibilities to one object by wrapping it** (logging, caching, retry around a
  call) is a **structural** pattern (decorator or proxy), not chain of responsibility. A
  decorator *always* forwards the call and adds something. A chain link *decides whether* to
  handle the request or pass it on.
- **Choosing which class to instantiate** ("create a PDF or CSV exporter based on the file
  type") is a **creational** factory. Strategy is about *behaviour after construction*.
- **"One class does too much / a change ripples through every `if`"** is first a **SOLID**
  conversation (SRP, OCP). The pattern is how you fix it, and interviewers want the principle
  named too.
- **Several threads produce events and consume them** is a concurrency question
  (producer/consumer with a queue). Observer alone says nothing about thread safety.

## Interview pitfalls

- **Pattern-name dropping.** Saying "I'll use Strategy" without showing the interface and the
  two concrete classes earns nothing. Draw the interface box.
- **A State without transitions.** Spell out the legal transitions (a small table or arrows) and
  what happens on an illegal event: ignore it, raise, or return an error.
- **Observer with no lifecycle.** Say how observers unsubscribe and what happens when one fails.
- **Inheritance where composition fits.** If a variant must change at runtime, Template method
  is the wrong choice. Use Strategy.
- **Over-patterning.** A two-branch `if` that will never grow doesn't need a Strategy hierarchy.
  Say "I'd start with a function and extract a Strategy when the third rule shows up".
