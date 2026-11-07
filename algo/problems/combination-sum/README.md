# Combination Sum

> Difficulty: **medium** · Patterns: backtracking · Sources: [leetcode](https://leetcode.com/problems/combination-sum/)

## Problem
Given an array of **distinct** positive integers `candidates` and a positive `target`, return
every unique combination of candidates whose sum is `target`. The **same number may be used
any number of times**. Two combinations are the same if they use the same numbers the same
number of times. Return them in any order.

## Examples
- `candidates = [2,3,6,7], target = 7` → `[[2,2,3],[7]]`
- `candidates = [2,3,5], target = 8` → `[[2,2,2,2],[2,3,3],[3,5]]`
- `candidates = [2], target = 1` → `[]`

## Constraints
- `1 <= len(candidates) <= 30`, `2 <= candidates[i] <= 40`, all distinct.
- `1 <= target <= 40`.

## Pattern & how to recognise it
- "Return **all combinations** that **satisfy a constraint** (sum to target)" → **Backtracking**.
  Build a combination one number at a time and abandon it as soon as the running sum passes the
  target.
- "Unlimited reuse" changes one detail of the recursion: after choosing `candidates[i]`, the
  next call may choose `candidates[i]` again.
- Not knapsack DP: DP can *count* the combinations, but you're asked to *list* them.
- Lesson: [Backtracking](../../learn/backtracking/01-intro.md).

## Learning material
- Choose / explore / un-choose: append a candidate to `path`, recurse with the smaller
  remaining target, then pop it.
- Passing a start index (only candidates at index `>= i`) keeps each combination in
  non-decreasing order, so `[2,3,2]` and `[2,2,3]` are never both generated.
- Sorting the candidates lets you `break` as soon as one is larger than the remaining target.
- [LeetCode 39](https://leetcode.com/problems/combination-sum/).

## Hints
<details><summary>Hint 1</summary>

How do you avoid producing both `[2,2,3]` and `[3,2,2]`?
</details>
<details><summary>Hint 2</summary>

`backtrack(start, remaining)`: try every candidate from `start` on. Which `start` do you pass
down if the same candidate may be reused?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Sort. `backtrack(start, remaining)`: if `remaining == 0`, record a copy of `path`. For `i` from
`start`: if `candidates[i] > remaining`, break; append it, call `backtrack(i, remaining -
candidates[i])` (`i`, not `i + 1`, because reuse is allowed), pop. Time roughly
O(n^(t/m)) for target `t` and smallest candidate `m`; space O(t/m) for the recursion depth.
</details>

## Follow-ups
- Combination Sum II (LeetCode 40): each number once, input has duplicates.
- Combination Sum III (LeetCode 216): `k` distinct digits 1..9.
- Only count the combinations → unbounded-knapsack DP (Coin Change II).
