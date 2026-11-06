# Towers of Hanoi

> Difficulty: **easy** · Patterns: recursion · Sources: [wikipedia](https://en.wikipedia.org/wiki/Tower_of_Hanoi)

## Problem
`n` disks of distinct sizes sit on peg **1**, largest at the bottom. Move them all to peg **3**,
using peg **2** as a helper. Move one disk at a time, and never put a larger disk on a smaller one.
Return the **minimal** sequence of moves, each move as `[from, to]`. The optimal sequence is unique.

## Examples
- `n = 1` → `[[1,3]]`
- `n = 2` → `[[1,2],[1,3],[2,3]]`: park the small disk on the helper, move the big one, then
  bring the small one on top.
- `n = 0` → `[]`

## Constraints
- `0 <= n <= 20`. The answer has `2^n - 1` moves, so exponential time is unavoidable. That is
  the output size, not inefficiency.

## Pattern & how to recognise it
- **A problem that shrinks to the same problem with `n-1`** → recursion. Assume you can already move
  `n-1` disks between any two pegs and build the `n` case from it.
- The recurrence for the number of moves, `T(n) = 2·T(n-1) + 1`, solves to `2^n - 1`.
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md) (recurrences).

## Learning material
- **Recursive leap of faith:** to move `n` disks `src → dst` via `aux`:
  1. move `n-1` disks `src → aux` (via `dst`),
  2. move the largest disk `src → dst`,
  3. move `n-1` disks `aux → dst` (via `src`).
- The recursion depth is `n`, so the stack is O(n). The call tree has `2^n - 1` nodes, one per move.
- An iterative solution exists. For odd/even `n`, the smallest disk cycles through the pegs in a
  fixed direction, and every other move is the only legal move not involving it.
- Reading: https://en.wikipedia.org/wiki/Tower_of_Hanoi

## Hints
<details><summary>Hint 1</summary>

The largest disk moves exactly once. What must be true of the other `n-1` disks right before that?
</details>
<details><summary>Hint 2</summary>

Write a helper `solve(k, src, dst, aux)` and call it twice with the roles of the pegs swapped.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`solve(k, src, dst, aux)`: if `k == 0`, return. Call `solve(k-1, src, aux, dst)`, append `[src, dst]`,
then call `solve(k-1, aux, dst, src)`. Start with `solve(n, 1, 3, 2)`.
Time O(2^n), space O(n) recursion (plus the output).
</details>

## Follow-ups
- Return only the move count (closed form `2^n - 1`).
- Which disk moves at step `k`? (the number of trailing zeros of `k`, plus one).
- Iterative solution without recursion.
- Four pegs (Reve's puzzle / Frame–Stewart).
