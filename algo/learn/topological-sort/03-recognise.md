## How to recognise it

**Strong signals:**
- **Dependencies or precedence**: prerequisites, "must happen before", build order, package
  imports, task scheduling, recipe steps, spreadsheet cell references.
- The question asks for **an order** that respects them, whether one **exists**, or the
  number of **rounds** needed.
- The input is a list of **pairs** `[a, b]` meaning "a before b" (or the reverse; read
  carefully), or a sorted list from which you must **infer** a precedence.
- Words like *schedule*, *prerequisite*, *order*, *depends on*, *cycle* (in a directed graph).

**Anti-signals: it looks similar, but it's a different pattern:**
- **Shortest path or minimum number of steps** between two states in an unweighted graph (word
  ladder, knight moves) → **BFS** from the start. Both use a queue, but plain BFS has no
  in-degrees and no dependency semantics.
- **Connected components / flood fill** in a grid ("number of islands") → **Islands** (DFS/BFS
  over cells). There's no direction and no order.
- **Merging overlapping time ranges** or counting rooms → **Merge Intervals**. Time order
  there comes from sorting numbers, not from dependency edges.
- "Run tasks with a cooldown" / "most frequent task first" → **Top 'K' Elements** / greedy
  with a heap. The constraint is spacing, not precedence.
- **Undirected** cycle detection or connectivity → union-find or DFS with a parent check.
  In-degrees mean nothing without direction (the leaf-peeling trick above is the exception).

**Complexity:**
- Time O(V + E): every node is enqueued once and every edge decremented once.
- Space O(V + E) for the adjacency list and in-degrees.
- With a min-heap for a lexicographic order: O((V + E) log V).

**Common pitfalls:**
- **Edge direction.** `prerequisites[i] = [a, b]` in LeetCode means *b before a*. Draw one
  edge on paper before coding.
- Forgetting nodes with **no edges at all**. Initialise the in-degree of every node (all `n`
  courses, every letter that appears) so isolated nodes still get into the queue.
- **Duplicate edges** in inferred graphs: adding the same edge twice inflates an in-degree
  that only gets decremented once. Dedupe, or decrement per stored edge consistently.
- Not checking `len(order) == n`. A cycle silently gives a short order.
- Recursion depth in the DFS version on long chains (Python's default limit is about 1000).
