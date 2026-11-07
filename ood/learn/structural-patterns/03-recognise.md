# Recognising structural patterns

| You hear… | Reach for |
|---|---|
| "we must use the vendor's / legacy API, but it doesn't match our interface" | **Adapter** |
| "add logging / caching / retry / compression *optionally*, in any combination" | **Decorator** |
| "load the big image only when it's displayed", "check permission before every call" | **Proxy** |
| "clients shouldn't have to know the 5 services an order touches" | **Facade** |
| "items and groups of items should be handled the same way" (folders, bundles, menus) | **Composite** |

## Look-alikes (anti-signals)

- **A request handled by the *first* object that can handle it**, and the others never see it
  → that's **chain of responsibility** (behavioral). A decorator always forwards.
- **Swapping *one algorithm* inside an object** → **Strategy** (behavioral). Decorator wraps
  the *whole object* from the outside. Strategy is plugged in from the inside.
- **Deciding which concrete class to create** → **factory** (creational). An adapter is about
  converting an *existing* object's interface.
- **"Prefer composition over inheritance"** is the *principle* behind most of these patterns.
  If the question is about the principle, the answer is design principles, not a pattern.

## Interview pitfalls

- **Adapter that leaks.** Returning the vendor's exception or receipt types through your
  interface defeats the purpose. Translate errors and results too.
- **Decorator order.** `Cache(Retry(Client))` and `Retry(Cache(Client))` behave differently.
  Say which order you want and why.
- **Facade as god class.** If the facade has business rules, they belong in a domain class.
  The facade only coordinates.
- **Composite without a common interface.** If the caller still writes
  `if isinstance(x, Folder)`, the composite isn't done.
