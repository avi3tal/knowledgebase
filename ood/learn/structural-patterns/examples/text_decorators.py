"""Worked example (decorator): stack formatting layers around a plain formatter.

Every layer has the same `render(text)` interface as the thing it wraps, so layers can be
stacked in any order and the caller can't tell how many there are.
"""


def render_message(text: str, layers: list[str]) -> str:
    class Formatter:
        def render(self, text: str) -> str:
            out = text  # note: the innermost object — the plain component does no formatting
            return out

    class Layer(Formatter):
        def __init__(self, inner: Formatter) -> None:
            self.inner = inner  # note: a decorator HAS-A formatter and IS-A formatter

    class Trim(Layer):
        def render(self, text: str) -> str:
            text = text.strip()  # note: Trim works on the way IN — it changes the text before delegating
            out = self.inner.render(text)
            return out

    class Upper(Layer):
        def render(self, text: str) -> str:
            inner = self.inner  # note: Upper passes the text down unchanged…
            out = inner.render(text).upper()  # note: …and upper-cases the result on the way OUT
            return out

    class Exclaim(Layer):
        def render(self, text: str) -> str:
            inner = self.inner  # note: outermost layer — the call starts here and goes one level down
            out = inner.render(text) + "!"  # note: Exclaim appends to whatever the inner layers produced
            return out

    kinds = {"trim": Trim, "upper": Upper, "exclaim": Exclaim}
    formatter: Formatter = Formatter()
    chain = "Formatter"
    for name in layers:
        formatter = kinds[name](formatter)  # note: wrap the current formatter in one more layer
        chain = f"{name}({chain})"
    out = formatter.render(text)  # note: one call on the outermost layer travels down the chain and back up
    return out
