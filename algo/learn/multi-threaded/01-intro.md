# Multi-threaded

> Pattern #23 · Tools: threads, processes, thread pools, futures, locks, condition variables

Most interview problems are about the *algorithm*. This one is about the *machine*: can
independent parts of the work run **at the same time**? Typical forms are "now make it
concurrent" follow-ups (compare two huge trees in parallel, invert a tree with a worker pool,
prefetch the next values of an iterator in the background) and **design** questions about
thread-safe structures (a bounded blocking queue, a rate limiter, printing in order across
threads).

**The insight:** concurrency only helps when the work splits into pieces that **don't depend
on each other** while they run, and when each piece is big enough to pay for the
coordination. Find the independent parts (the *fork*), run them concurrently, and combine the
results at a single synchronisation point (the *join*).

```
                 tree_sum(5)                       fork:  submit left and right
               /             \
       tree_sum(3)         tree_sum(8)             ← independent: no shared writes
        /     \               \
   sum(1)   sum(4)          sum(9)
               \             /
                 5 + 8 + 17 = 30                   join:  wait for both, then combine
```

## Threads vs processes, and the GIL

| | Threads | Processes |
|---|---|---|
| Memory | shared: cheap to pass data, needs locks | separate: data is copied (pickled) |
| Start-up cost | small | larger |
| Python CPU-bound work | **no speed-up** in the default CPython build (the GIL) | real parallelism |
| Python I/O-bound work | great: the GIL is released while waiting | works, but heavier |

**The GIL** (Global Interpreter Lock) in the default CPython build lets only one thread run
Python bytecode at a time. Threads still help when they spend their time **waiting**: network,
disk, sleep, or C extensions that release the lock. For **CPU-bound** pure-Python work, use
processes (`ProcessPoolExecutor`, `multiprocessing`). Python 3.13+ also ships an optional
free-threaded build without the GIL, but don't assume it in an interview.

**Go** has no GIL. Goroutines are cheap (a few KB of stack) and run truly in parallel across
cores. You coordinate them with `sync.WaitGroup`, `sync.Mutex`, `sync.Cond` and channels.

## Fork–join with a pool and futures

```python
from concurrent.futures import ThreadPoolExecutor

def parallel_sum(root, pool, depth=0):
    if root is None:
        return 0
    if depth >= 2:                          # small enough: stay sequential
        return sequential_sum(root)
    left = pool.submit(parallel_sum, root.left, pool, depth + 1)    # fork
    right = parallel_sum(root.right, pool, depth + 1)               # do one half yourself
    return root.val + left.result() + right                          # join: block on the future

with ThreadPoolExecutor(max_workers=4) as pool:
    total = parallel_sum(root, pool)
```

- A **future** is a handle to a result that isn't ready yet. `.result()` blocks until it is (and
  re-raises the worker's exception).
- **Cut off** at a depth, or a subtree size, and continue sequentially below it. Spawning a task
  per node costs far more than the addition it does.
- Never block on futures that can only run if more workers are free. Deep recursion that
  `submit`s and then waits can **exhaust a bounded pool and deadlock**. The cutoff also
  prevents that.

```go
func parallelSum(root *TreeNode, depth int) int {
    if root == nil { return 0 }
    if depth >= 2 { return sequentialSum(root) }
    var left int
    var wg sync.WaitGroup
    wg.Add(1)
    go func() { defer wg.Done(); left = parallelSum(root.Left, depth+1) }()  // fork
    right := parallelSum(root.Right, depth+1)
    wg.Wait()                                                             // join
    return root.Val + left + right
}
```

## About the animation below

The studio replays a recorded, **deterministic** run, so it traces the **sequential** version.
A real concurrent run interleaves differently every time and can't be replayed step by step.
Read the narration as the plan for the parallel version: every pair of sibling calls is a
**fork** point and every `return` that adds them up is a **join**. The call stack shows one
path at a time. In the concurrent version, several of those paths would be live at once, one
per worker.
