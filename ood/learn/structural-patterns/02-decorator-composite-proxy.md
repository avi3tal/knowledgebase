# Decorator, Composite, Proxy

## Decorator: add behaviour by wrapping

A decorator implements the same interface as the object it wraps, holds a reference to it,
and adds something before or after forwarding. Because the interface is the same, layers stack:

```
           ┌──────────────────────┐
           │ «interface» Formatter│◁─────────────┐
           │ render(text) → str   │              │ inner
           └──────────▲───────────┘              │
            ┌─────────┴──────────┐               │
        PlainFormatter        Layer ◇────────────┘
                     ┌──────────┼──────────┐
                   Trim       Upper     Exclaim

 Exclaim( Upper( Trim( Plain ) ) ).render("  hello  ")   →   "HELLO!"
```

Before: one subclass per combination (`TrimmedUpperFormatter`, `UpperExclaimFormatter`, …)
grows as 2ⁿ. After: n small layers, combined at runtime.

In the trace, watch the call stack grow one `render` frame per layer on the way in (Trim strips
the text *before* delegating) and shrink on the way out (Upper and Exclaim work *after* the inner
result comes back).

**Python note:** `@decorator` functions are the same idea applied to functions. In an OOD
answer, draw the class version.

## Composite: a tree you can treat as one node

Leaves and groups implement one interface, and a group's method loops over its children.

```
 «interface» Node: size() → int
      ▲
  ┌───┴──────┐
 File      Folder ◇──── children: list[Node]
            size() = sum(child.size() for child in children)
```

```python
class File:
    def __init__(self, n: int) -> None:
        self.n = n
    def size(self) -> int:
        return self.n

class Folder:
    def __init__(self, *children: "File | Folder") -> None:
        self.children = list(children)
    def size(self) -> int:
        return sum(c.size() for c in self.children)   # recursion through the tree
```

Signals: file systems, org charts, UI widget trees, menus with sub-menus, bundles of products
priced as one. The caller never asks "is this a leaf?".

**Visual note:** the `tree` view is binary (left/right), so an n-ary composite isn't animated
here.

## Proxy: same interface, controlled access

| Proxy flavour | What it adds |
|---|---|
| Virtual / lazy | builds the expensive real object on first use |
| Caching | returns a stored answer instead of calling through |
| Protection | checks permissions before forwarding |
| Remote | the real object lives in another process; the proxy does the network call |

**Decorator vs Proxy.** The code is almost identical. The difference is intent. A decorator
**adds features** the client asks for and is often stacked. A proxy **controls access** to one
real subject and usually manages that subject's lifecycle. In an interview, name the intent.
