# Producer / consumer with a bounded buffer

Producers create work faster or slower than consumers can handle it. A **bounded** buffer
between them gives you two kinds of back-pressure:

- buffer **full** → producers **wait** on a condition `not_full`
- buffer **empty** → consumers **wait** on a condition `not_empty`

```
 producers ─▶ [ a | b | c ] ─▶ consumers        ring buffer, capacity 3
                ▲head   ▲tail                   count tells full from empty
```

The real thing in Python:

```python
import threading
from collections import deque

class BoundedBuffer:
    def __init__(self, capacity: int) -> None:
        self._items: deque[str] = deque()
        self._capacity = capacity
        self._lock = threading.Lock()
        self._not_full = threading.Condition(self._lock)   # both share ONE lock
        self._not_empty = threading.Condition(self._lock)

    def put(self, item: str) -> None:
        with self._not_full:
            while len(self._items) == self._capacity:      # while, not if
                self._not_full.wait()
            self._items.append(item)
            self._not_empty.notify()

    def take(self) -> str:
        with self._not_empty:
            while not self._items:
                self._not_empty.wait()
            item = self._items.popleft()
            self._not_full.notify()
            return item
```

Three details interviewers check:

- **`while`, not `if`, around `wait()`.** A woken thread must re-check the condition. Another
  consumer may have taken the item first, and spurious wake-ups happen.
- **Both conditions share one lock**, so "check then act" is atomic.
- **`notify` after the state change**, while still holding the lock.

In production Python you'd use `queue.Queue(maxsize=n)`, which does exactly this. Say so, then
show you understand what it does inside.

The trace below steps through the same logic one operation at a time. A blocked producer or
consumer is recorded in `blocked_puts` / `blocked_takes` instead of sleeping. Watch `head` and
`tail` wrap around the ring, and watch a `take` on a full buffer wake the waiting producer.
