from dataclasses import dataclass


class DispatcherTuple(tuple):
    def __getattr__(self, item):
        return DispatcherTuple([getattr(i, item) for i in self])


@dataclass
class Foo:
    i: int


d = DispatcherTuple([Foo(i) for i in range(10)])

print(d.i)
