# Subset Sum

> Difficulty: **easy** · Patterns: knapsack-0-1 · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/problems/subset-sum-problem-1611555638/1)

## Problem
Given an array of non-negative integers `nums` and an integer `target`, return `true` if some
subset of `nums` (each element used **at most once**) adds up to exactly `target`, else `false`.
The empty subset sums to 0.

## Examples
- `nums = [3, 34, 4, 12, 5, 2]`, `target = 9` → `true` (4 + 5)
- `nums = [3, 34, 4, 12, 5, 2]`, `target = 30` → `false`
- `nums = [1, 2, 3, 7]`, `target = 6` → `true` (1 + 2 + 3)

## Constraints
- `1 <= len(nums) <= 200`, `0 <= nums[i] <= 100`, `0 <= target <= 10^4`.
- Trying all 2ⁿ subsets is hopeless for n = 200. The target is small, so aim for O(n · target).
- In the benchmark, `n` items are drawn from 2..20 (all even) and the target is odd and grows
  with `n`, so a correct solution can't stop early.

## Pattern & how to recognise it
- Each number is **in or out, once**, and you ask about reaching a **small integer target** →
  **0/1 knapsack** with a boolean cell: "can the first `i` numbers make sum `s`?".
- It's the simplest member of the subset-sum family. Equal partition, minimum difference and
  target sum all reduce to it.
- Lesson: [0/1 Knapsack](../../learn/knapsack-0-1/01-intro.md).

## Learning material
- State: `(i, s)` = "using numbers from index `i` on, can I make `s`?". Two choices per number:
  skip it, or take it (if it fits). Memoise the `(i, s)` pairs or fill a table.
- Table: `dp[i][s]` is true if the first `i` numbers can make `s`. `dp[0][0] = true`. The row for
  each number only reads the row above, so each number is used at most once.
- One-row version: a boolean array over `0..target`, updated **from right to left** per number.
- Read: [Subset sum problem (GeeksforGeeks)](https://www.geeksforgeeks.org/subset-sum-problem-dp-25/).

## Hints
<details><summary>Hint 1</summary>

Write the brute-force recursion: for the current number, either skip it or subtract it from the
target. What two numbers describe every call?
</details>
<details><summary>Hint 2</summary>

There are only `n × (target + 1)` different calls. Store a boolean per `(i, s)`.
</details>
<details><summary>Hint 3</summary>

With one array `dp[0..target]`, which direction must the inner loop go so a number isn't used
twice?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp = [True] + [False] * target`. For each number `x`, for `s` from `target` down to `x`:
`dp[s] = dp[s] or dp[s - x]`. Return `dp[target]`.

Expected complexity: time O(n · target), space O(target).

</details>

## Follow-ups
- Return one subset that works (keep the 2-D table and walk back).
- Count the subsets instead (Count of Subset Sum).
- Negative numbers: shift the sums by the total of the negatives, or use a set of reachable sums.
