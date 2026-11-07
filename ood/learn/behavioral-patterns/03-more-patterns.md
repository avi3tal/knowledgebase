# Command, Chain of Responsibility, Template Method

## Command: an action as an object

Turn "do X" into an object with `execute()` (and often `undo()`). Once actions are objects
you can **queue** them, **log** them, **retry** them, **undo** them or **replay** them.

```python
class Command(Protocol):
    def execute(self) -> None: ...
    def undo(self) -> None: ...

class InsertText:
    def __init__(self, doc: "Editor", pos: int, text: str) -> None:
        self.doc, self.pos, self.text = doc, pos, text
    def execute(self) -> None:
        self.doc.insert(self.pos, self.text)
    def undo(self) -> None:
        self.doc.delete(self.pos, len(self.text))

class History:
    def __init__(self) -> None:
        self.done: list[Command] = []
    def run(self, cmd: Command) -> None:
        cmd.execute()
        self.done.append(cmd)
    def undo(self) -> None:
        if self.done:
            self.done.pop().undo()
```

Signals: *undo/redo*, *macro recording*, *job queue*, *audit trail of actions*, *remote control
with buttons you can assign*.

## Chain of responsibility: pass it along until someone handles it

Handlers are linked together. Each one either handles the request or passes it to the next.
The sender doesn't know which handler will answer.

```
 request ─▶ [AuthCheck] ─▶ [RateLimit] ─▶ [Validate] ─▶ [Handler]
              │ reject        │ reject       │ reject
```

```python
class Step:
    def __init__(self, nxt: "Step | None" = None) -> None:
        self.nxt = nxt
    def handle(self, req: dict) -> str:
        return self.nxt.handle(req) if self.nxt else "ok"

class RequireUser(Step):
    def handle(self, req: dict) -> str:
        if "user" not in req:
            return "401"
        return super().handle(req)
```

Signals: *middleware*, *support escalation (agent → lead → manager)*, *approval by amount*,
*a list of filters, each of which may stop the request*.

## Template method: a fixed skeleton with steps you fill in

The base class owns the order of steps. Subclasses override only the steps that differ.

```python
class Report(ABC):
    def render(self) -> str:                 # the template — not overridden
        return self.header() + self.body() + self.footer()
    def header(self) -> str:
        return "== report ==\n"
    @abstractmethod
    def body(self) -> str: ...
    def footer(self) -> str:
        return ""

class SalesReport(Report):
    def body(self) -> str:
        return "sales: 42\n"
```

**Template method vs Strategy.** Template method varies steps through **inheritance**, so the
choice is fixed when you pick the subclass. Strategy varies them through **composition**, so it
can be swapped at runtime. Interviewers like Strategy better unless the skeleton really is fixed
and the variants are few.
