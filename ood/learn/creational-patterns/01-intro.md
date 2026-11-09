# Creational patterns

> Design patterns · Factory method, Abstract factory, Builder, Singleton (and when not to)

`ClassName(...)` written all over the code ties every caller to one concrete class and to its
constructor arguments. Creational patterns put **object creation in one place**, so the rest
of the code depends on an interface and doesn't care which concrete class it got.

| Pattern | Use when | Python-flavoured form |
|---|---|---|
| Simple factory / registry | pick one class from a key (type, config, file extension) | `dict[str, type]` + `create(kind)` |
| Factory method | a base class needs "a product", subclasses decide which | overridable `make_x()` method |
| Abstract factory | create *families* of objects that must match | an object with several `make_*` methods |
| Builder | many optional parts, validation across parts, immutable result | builder object, `build()` validates |
| Singleton | exactly one instance is a real domain fact | a module-level instance, or DI |

## Simple factory with a registry

Before: every caller branches on the type.

```python
if fmt == "csv":
    exporter = CsvExporter(delimiter=",")
elif fmt == "json":
    exporter = JsonExporter(indent=2)
# … repeated in three places; a new format means editing all of them
```

After: one registry. New formats register themselves, and callers ask by key.

```python
class Exporter(Protocol):
    def export(self, rows: list[dict]) -> str: ...

_EXPORTERS: dict[str, Callable[[], Exporter]] = {}

def register(fmt: str):
    def wrap(cls):
        _EXPORTERS[fmt] = cls
        return cls
    return wrap

@register("csv")
class CsvExporter: ...

def make_exporter(fmt: str) -> Exporter:
    try:
        return _EXPORTERS[fmt]()
    except KeyError:
        raise ValueError(f"unknown format {fmt!r}") from None
```

This is OCP in action: adding a format adds a class and touches no `if` chain.

## Factory method

The base class runs the workflow and asks subclasses for the product:

```python
class Report(ABC):
    def publish(self, rows) -> str:
        return self.make_exporter().export(rows)   # the factory method
    @abstractmethod
    def make_exporter(self) -> Exporter: ...

class FinanceReport(Report):
    def make_exporter(self) -> Exporter:
        return CsvExporter()
```

## Abstract factory: families that must match

A UI theme needs a `Button`, a `Checkbox` and a `Dialog` that all come from the *same* theme.
Mixing a dark button with a light dialog is a bug. One factory object returns the whole family:

```figure
abstract-factory
```

The client receives one `WidgetFactory`, so it can't mix families by accident.
