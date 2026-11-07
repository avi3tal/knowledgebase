# Maximum Ribbon Cut

> Difficulty: **medium** · Patterns: unbounded-knapsack · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/problems/cutted-segments1642/1)

## Problem
You have a ribbon of length `total` and a list of allowed piece lengths `lengths`. Cut the whole
ribbon into pieces whose lengths are all in `lengths` (each length can be used any number of
times, and nothing may be left over). Return the **maximum number of pieces**, or `-1` if the
ribbon can't be cut exactly. A ribbon of length 0 gives 0 pieces.

## Examples
- `lengths = [2, 3, 5]`, `total = 5` → `2` (2 + 3).
- `lengths = [2, 3]`, `total = 7` → `3` (2 + 2 + 3).
- `lengths = [3, 5]`, `total = 7` → `-1`.

## Constraints
- `1 <= len(lengths) <= 100`, `1 <= lengths[i] <= 10^4`, `0 <= total <= 10^4`.
- Trying every cut sequence is exponential. Aim for O(k · total), k = number of lengths.
- In the benchmark the lengths are fixed (`[3, 5, 7]`) and `n = total`.

## Pattern & how to recognise it
- Pieces are **reusable**, the ribbon length is a **budget that must be used exactly**, and you
  **maximise** the count → **unbounded knapsack**, maximum version.
- It's the mirror of Coin Change (fewest coins): same table, `max` instead of `min`.
- Greedy (always cut the shortest piece) fails when the shortest piece can't finish the job:
  `lengths = [2, 5]`, `total = 9` → 2 + 2 + 5, not four 2s and a leftover 1.
- Lesson: [Unbounded Knapsack](../../learn/unbounded-knapsack/01-intro.md).

## Learning material
- `dp[t]` = the most pieces that exactly make length `t`, or −∞ if `t` can't be made. `dp[0] = 0`.
- For each length `L`, for `t` from `L` up to `total`: if `dp[t - L]` is reachable,
  `dp[t] = max(dp[t], dp[t - L] + 1)`.
- The "unreachable" marker matters. With 0 as the default you'd count leftovers as valid.
- Read: [Maximize the number of segments (GeeksforGeeks)](https://www.geeksforgeeks.org/maximize-the-number-of-segments-of-length-p-q-and-r/).

## Hints
<details><summary>Hint 1</summary>

What's the answer for length 0? How does the answer for `t` relate to the answer for `t − L`?
</details>
<details><summary>Hint 2</summary>

How do you tell "0 pieces" apart from "impossible" in your table?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp = [0] + [-inf] * total`. For each `L`, for `t` in `L..total`: `dp[t] = max(dp[t], dp[t - L] + 1)`
(−∞ + 1 stays −∞). Return `dp[total]` if it's finite, else −1.

Expected complexity: time O(k · total), space O(total).

</details>

## Follow-ups
- Minimum number of pieces (that's Coin Change).
- Each piece has a price; maximise revenue (Rod Cutting).
- Return the pieces themselves.
