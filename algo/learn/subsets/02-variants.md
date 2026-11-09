## Variants

### More than two choices per position

Subsets has a binary choice per element. Many generators have **k choices** per position, and
the template is the same: for each position, replace the current level with every partial
result extended by every option.

```python
level = [""]
for position in positions:
    level = [partial + option for partial in level for option in options(position)]
```

The example below builds letter combinations of a phone number: digit `2` offers `abc` and
digit `3` offers `def`, so the level grows 1 → 3 → 9.

### Duplicates in the input

`[1, 3, 3]` with the plain template produces `[3]` twice and `[1, 3]` twice. Two fixes:

1. **Sort** so equal values are neighbours.
2. When `nums[i] == nums[i - 1]`, extend **only the subsets created in the previous step**, not
   the whole list. Remember where that step's new subsets started.

```figure
duplicates-last-step
```

Extending `[]` or `[1]` again with the second `3` would rebuild `[3]` and `[1, 3]`. Only the
subsets that already contain the first `3` can take the second one.

### Partial results that carry state

Sometimes a partial result is more than a list. In **balanced parentheses** each partial string
carries its `open` and `close` counts, and you may only add `)` while `close < open`. In
**generalized abbreviations** each one carries a pending count of skipped characters. Store
tuples in the level (or a queue): `(prefix, open, close)`. Any option that breaks a rule is
simply never added. That's BFS with pruning.

### Permutations: insert instead of append

For permutations, each new number is **inserted at every position** of every permutation so
far: `[1]` → `[2,1], [1,2]` → `[3,2,1], [2,3,1], [2,1,3], …`. That gives n! results. The
problem pages `permutations` and `permutations-of-string` (in the Backtracking lesson) can be
solved this way too.

### BFS or recursion?

Every generator here can also be written as recursion (DFS): one call per position, one branch
per option. BFS keeps all partial results of a level in memory; DFS keeps one path and the call
stack. For "generate them all" both cost O(output). Pick whichever is clearer. Once you need
to **abandon partial results early under a constraint**, the recursive form becomes
backtracking (next lesson).
