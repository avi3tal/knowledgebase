# How to recognise it

**Strong signals:**
- The problem is **defined in terms of itself**: "f(n) = something with f(n − 1)", nested
  structures (folders, nested lists, expressions, trees).
- The input splits naturally into **the first item + the rest** or **two halves**.
- "Generate **all** strings / arrangements of length n" → tree recursion (and then Backtracking
  or Subsets).
- Trees and graphs: almost every traversal is easiest to write recursively (DFS).
- The task explicitly says "solve it recursively".

**Anti-signals: it looks similar, but it's a different pattern:**
- The recursion tree **repeats subproblems** (the same arguments over and over) → **Dynamic
  Programming** (memoise or tabulate). Exponential becomes polynomial.
- You must explore choices and **undo** them, pruning dead ends early (N-Queens, Sudoku, combination
  sum) → **Backtracking**.
- Process items in **arrival order / level by level** → **BFS** with a queue. Recursion is
  depth-first by nature.
- A simple linear scan with constant state: a loop is clearer and has no depth limit.
  Recursion adds O(n) stack space for nothing.
- Matching or "next greater" questions → an explicit **Stack**, even though recursion uses a
  stack internally.

**Complexity:**
- Time = number of calls × work per call. Draw the recursion tree, count nodes per level, and
  multiply by the number of levels.
- Space = maximum depth × frame size, plus whatever you allocate (slices!).

**Common pitfalls:**
- A missing or wrong **base case** (e.g. forgetting n = 0 or the empty list) → infinite recursion
  / `RecursionError`.
- An input that **doesn't shrink** on every path (e.g. `f(n)` calls `f(n)` when n is odd).
- **Ignoring the return value** of the recursive call: `solve(rest)` instead of
  `return x + solve(rest)`.
- Slicing (`nums[1:]`, `s[1:]`) in every call: hidden O(n) copies. Pass an index.
- Sharing one mutable list across branches without undoing changes, so the branches see each
  other's choices.
