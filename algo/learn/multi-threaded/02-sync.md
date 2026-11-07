## Sharing state safely: locks, conditions, queues

Fork–join with **no shared writes** (each task returns its result) needs no locks at all. That
is the design to aim for. When threads *must* share mutable state, you need synchronisation.

**Race condition.** `count += 1` is a read, an add and a write. Two threads can both read 5
and both write 6. Any read-modify-write on shared data needs a **lock** (mutex):

```python
lock = threading.Lock()
with lock:              # acquire … release, even on exceptions
    count += 1
```

**Condition variable: wait until something becomes true.** A condition pairs a lock with a
wait/notify mechanism. The canonical example is a **bounded blocking queue** (producer–consumer):

```python
class BoundedBlockingQueue:
    def __init__(self, capacity: int):
        self.items = collections.deque()
        self.capacity = capacity
        self.cond = threading.Condition()

    def enqueue(self, x: int) -> None:
        with self.cond:
            while len(self.items) == self.capacity:   # WHILE, not if
                self.cond.wait()                      # releases the lock while sleeping
            self.items.append(x)
            self.cond.notify_all()                    # wake consumers waiting for "not empty"

    def dequeue(self) -> int:
        with self.cond:
            while not self.items:
                self.cond.wait()
            x = self.items.popleft()
            self.cond.notify_all()                    # wake producers waiting for "not full"
            return x
```

**Always re-check the condition in a `while` loop.** A woken thread isn't guaranteed that the
condition still holds. Another consumer may have taken the item first (or the wake-up was
spurious). With `if` instead of `while`, it pops from an empty queue. (The old
`archive/concurrency/blocking_queue.py` in this repo has exactly this bug in `dequeue`. Spot it
as an exercise.)

Python already ships a correct one: `queue.Queue(maxsize=k)`. In Go, a **buffered channel**
`make(chan int, k)` *is* a bounded blocking queue.

**Prefetching (the BST iterator follow-up).** A plain `BSTIterator` does its work inside
`next()`, using a stack of left spines. A concurrent version runs the in-order traversal in a
**background producer thread** that pushes values into a bounded blocking queue. `next()` then
just dequeues. The bound keeps memory at O(k) instead of O(n), and the consumer rarely waits.
This only pays off if the caller does real work between calls to `next()`.

**Classic hazards:**
- **Deadlock:** two threads each hold one lock and wait for the other's. Fix it by always
  acquiring locks in the same global order, or by holding one lock at a time.
- **Lost wake-up:** checking the condition outside the lock, then waiting. Always check and wait
  while holding the condition's lock.
- **Starvation / oversubscription:** more CPU-bound workers than cores just adds context
  switches.
