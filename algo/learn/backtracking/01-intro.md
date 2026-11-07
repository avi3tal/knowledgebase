# Backtracking

> Pattern #22 · Data structures: array, hash table (plus the call stack)

Some problems ask you to **build** something piece by piece (a combination, an arrangement, a
path through a grid, a filled-in board) where every piece must fit with the pieces already
placed. Trying every complete candidate and checking it at the end is hopeless: 9 digits in 50
Sudoku cells is 9⁵⁰ boards.

**The insight:** build the candidate **one choice at a time** and check the rules **after each
choice**. The moment a partial candidate breaks a rule (or can't possibly lead to a solution),
**abandon it and undo the last choice**: that's *backtracking*. Everything that would have
been built on top of the bad prefix is skipped in one go.

```
k = 2 digits from 1..9 that add up to 5            path        remaining
                         ┌── choose 1 ──────────── [1]          4
                         │     ├── choose 2        [1,2]        2 → full, ≠ 0, back up
                         │     ├── choose 3        [1,3]        1 → full, ≠ 0, back up
                         │     ├── choose 4        [1,4]        0 → record [1,4]
                         │     └── 5 > 4: prune, stop the loop
start ── backtrack(1, 5) ┼── choose 2 ──────────── [2]          3
                         │     ├── choose 3        [2,3]        0 → record [2,3]
                         │     └── 4 > 3: prune, stop the loop
                         └── 3 + 4 > 5: prune — no two digits ≥ 3 fit, stop
```

## Choose / explore / un-choose: the template

```python
def backtrack(state):
    if <state is a complete solution>:
        record(copy of state)
        return
    for choice in <choices available from this state>:
        if not <choice is valid / can still lead to a solution>:
            continue                  # or break, if later choices are even worse
        <apply choice>                # choose
        backtrack(next state)         # explore
        <undo choice>                 # un-choose: the state is exactly as before
```

Three things make it work:

- **One shared, mutable state** (the `path`, the board, the used-sets) that every call changes
  and then **restores**. That's why the un-choose step must undo *exactly* what the choose step
  did.
- **Record a copy**. `result.append(path)` stores a reference to the list you're about to keep
  mutating. All entries would end up empty. Use `path[:]`.
- **Prune as early as possible.** Each check that rejects a prefix deletes a whole subtree of
  the search. Sorting the choices often turns `continue` into `break`.

## Avoiding duplicate combinations

For combinations (order doesn't matter), pass a **start index**: a call may only pick choices
at or after `start`. Then `[1, 4]` is built but `[4, 1]` never is. Pass `i + 1` if each
element can be used once, or `i` if it may be reused.

In the example below, the call stack on the right shows the recursion. Watch `path` grow on
**choose** and shrink on **un-choose**, and see the loop `break` when the remaining budget can't
fit the digits that are left.
