# Tower Hopper

> Difficulty: **medium** · Patterns: greedy, dp-1d · Sources: [youtube](https://www.youtube.com/watch?v=kHWy5nEfRIQ), [geeksforgeeks](https://www.geeksforgeeks.org/minimum-number-of-jumps-to-reach-end-of-a-given-array/)

## Problem
`towers[i]` is the height of the tower at position `i`. Standing on tower `i` you may hop forward by
**1 up to `towers[i]`** positions. A tower of height 0 is a dead end. You start on tower 0. Return
`true` if you can hop **past the last tower** (to any position `>= len(towers)`), else `false`.

## Examples
- `[4, 2, 0, 0, 2, 0]` → `true`: hop 0 → 4 (height 2), then 4 → 6, which is past the end.
- `[1, 0]` → `false`: from 0 you can only reach the 0-tower at index 1.
- `[3, 2, 1, 0, 4]` → `false`: every path ends on the 0 at index 3.

## Constraints
- `1 <= len(towers) <= 10^5`, `0 <= towers[i] <= 10^5`.
- Trying every path is exponential. A DP over positions that looks back at all previous towers is
  O(n²). Aim for one O(n) pass.

## Pattern & how to recognise it
- **"Can you reach the end with variable jump lengths?"** → greedy *furthest reach*: you never need
  to know *which* path, only how far any path can get.
- The minimum-jumps version is the same scan, counting "levels" like a BFS (still greedy, O(n)).
- It's the same problem as **Jump Game (LeetCode 55)**, except the goal is index `n` (one past
  the end) instead of `n - 1`.
- See [algo/notes/patterns.md](../../notes/patterns.md).

## Learning material
- **Greedy invariant:** keep `reach` = the furthest index reachable so far. Walk `i` from 0 while
  `i <= reach`, updating `reach = max(reach, i + towers[i])`. If `reach >= n` you're out. If `i`
  passes `reach`, you're stuck. Each index is visited once, so this is O(n) time and O(1) space.
- **Why greedy is safe:** reachability is monotone. If you can reach index `k`, you can reach every
  index before it, so the furthest reach is all you need to track.
- **DP view:** `ok[i] = any(ok[j] and j + towers[j] >= i for j < i)` is correct but O(n²). It's a
  good stepping stone to the greedy.
- Video: https://www.youtube.com/watch?v=kHWy5nEfRIQ

## Hints
<details><summary>Hint 1</summary>

Instead of choosing where to hop, track how far you *could* get from everything visited so far.
</details>
<details><summary>Hint 2</summary>

If the current index is beyond that furthest reach, no path gets here.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`reach = 0`. For `i` in `0..n-1`: if `i > reach`, return false. Set `reach = max(reach, i + towers[i])`.
If `reach >= n`, return true. After the loop, return false. Time O(n), space O(1).
</details>

## Follow-ups
- Minimum number of hops (Jump Game II, LeetCode 45): greedy BFS levels in O(n).
- Jumps allowed in both directions to reach a 0 (Jump Game III, LeetCode 1306): graph BFS.
- Return the actual path of hops.
