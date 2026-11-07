## How to recognise it

**Strong signals that concurrency is the right tool:**
- The work splits into **independent** pieces with no shared writes: two subtrees, two trees
  compared node by node, chunks of an array, separate files or URLs.
- The pieces are **slow because they wait** (network, disk, an external service), or they're
  **CPU-heavy and large** with several cores available. In Python, use processes for the
  CPU-heavy case.
- The statement says *concurrently*, *in parallel*, *thread-safe*, *producer/consumer*,
  *background*, *prefetch*, *block until*.
- A **design** question where callers on different threads must wait for each other (bounded
  blocking queue, read–write lock, "print FooBar alternately").

**Anti-signals: concurrency is the wrong tool (or not the main idea):**
- **Small inputs or tiny per-item work.** Thread start-up and synchronisation cost
  microseconds. Summing 100 tree nodes in parallel is slower than a plain **DFS**.
- **Inherently sequential dependencies:** each step needs the previous result (Fibonacci-style
  DP, a running prefix, BFS **levels** where level k+1 needs level k). You can parallelise
  *within* a level at best, so the algorithm is still **BFS** / DP.
- **Ordering is the hard part.** Merging k sorted streams → **K-way Merge** with a heap.
  Reading the streams in parallel doesn't produce the merged order.
- "k largest / most frequent" → **Top 'K' Elements**. A faster machine doesn't fix an
  O(n log n) vs O(n log k) choice.
- CPU-bound **pure Python with threads** in the default CPython build: the GIL serialises it.
  That's a reason to use processes, not a reason to add threads.

**Complexity: work and span.**
- **Work** W = total operations (the same as the sequential algorithm, plus overhead).
- **Span** S = the longest chain of dependent steps (for a balanced tree, its height).
- With p workers, the time is about max(W / p, S). Splitting a balanced tree gives
  S = O(log n). A degenerate (list-shaped) tree has S = O(n), so it gets **no speed-up**.

**Common pitfalls:**
- Sharing a mutable result (a counter, a list) without a lock. Return values from tasks
  instead.
- `if` instead of `while` around `cond.wait()`.
- Submitting a task per node: overhead dominates, and blocking on child futures inside a
  bounded pool can deadlock. Use a depth or size cutoff.
- Forgetting to call `.result()` (or `wg.Wait()`): exceptions in workers vanish silently and
  the join never happens.
- Testing concurrent code only once. Races are timing-dependent. Keep the algorithm
  deterministic and test it single-threaded, then test the synchronisation separately.
