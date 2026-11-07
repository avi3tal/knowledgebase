## How to recognise it

**Strong signals:**
- "Find **all** / **any** combination, arrangement, placement or path that **satisfies** …":
  combination sum, N-Queens, Sudoku, word search, palindrome partitioning.
- Each step's legal choices **depend on the choices already made** (no attacks, no reuse, sum
  must not exceed the target).
- **Small inputs** (n ≤ 10–20, a 9×9 board, a 6×6 grid). The search is exponential in the worst
  case; pruning makes it practical.
- The answer is a list of **structures**, not a single number.

**Anti-signals: it looks similar, but it's a different pattern:**
- **Every** combination is an answer and nothing is ever rejected (all subsets, all letter-case
  variants) → **Subsets**: generate level by level from the empty set. Backtracking still works,
  but there's nothing to prune, so the simpler BFS template is the usual choice.
- Only the **count** or the **best value** is asked (number of ways to make the sum, min coins,
  max profit) and subproblems repeat → **Knapsack / DP** (`knapsack-0-1`,
  `unbounded-knapsack`). Backtracking would enumerate each way separately, exponentially. Ask:
  "do I need the actual lists, or just a number?"
- Visiting every reachable cell or node **once** (count islands, flood fill, connected
  components) → **Islands / DFS**. Their visited marks are never undone.
- **Permutations** sit in between: every ordering is valid (like subsets), but "each element
  used once per ordering" is a constraint on the path, so they're usually written as
  backtracking with a `used` set. The BFS insert-at-every-position version is the subsets-style
  alternative.

**Complexity:**
- Exponential in the worst case: about (choices per step)^(depth), times the cost to record a
  solution. Combination sum ~ O(n^(target/min)), N-Queens ~ O(n!), Sudoku ~ O(9^empty).
- Space O(depth) for the call stack and the current path, plus the output.

**Common pitfalls:**
- Recording `path` instead of `path[:]` (or `list(path)`): every stored answer is the same list.
- An un-choose that doesn't exactly mirror the choose (forgetting to remove from one of the
  three sets, or unmarking a grid cell), so state leaks into sibling branches.
- Duplicate combinations: no start index, or `i` vs `i + 1` mixed up (reuse vs no reuse).
- Duplicates in the input: sort and skip `nums[i] == nums[i - 1]` at the same depth.
- Pruning with `break` on unsorted choices. It's only safe when later choices are no better.
