# Trapping Rain Water

> Difficulty: **hard** · Patterns: two-pointers, dynamic-programming · Sources: [leetcode](https://leetcode.com/problems/trapping-rain-water/)

## Problem
Given `n` non-negative integers `height`, an elevation map where every bar has width 1, compute
how many units of water it traps after raining.

## Examples
- `[0,1,0,2,1,0,1,3,2,1,2,1]` → `6`.
- `[4,2,0,3,2,5]` → `9`: 2 + 4 + 1 + 2 units above the four inner bars.
- `[1,2,3,4]` → `0`: water runs off a monotonic slope.

## Constraints
- `1 <= n <= 2 * 10^4`, and `0 <= height[i] <= 10^5`.
- Target: O(n) time. The two-pointer solution also gets **O(1) extra space**.

## Pattern & how to recognise it
- The water above bar `i` is `min(max height to its left, max height to its right) - height[i]`.
  Computing the two maxima naively for each `i` is O(n²).
- **Prefix and suffix maxima** (a small DP) give O(n) time with two O(n) arrays.
- **Opposite-ends two pointers** remove those arrays. Whichever side has the smaller running
  max is the one whose water level is already known, so you can settle that bar and move
  inward. Signals: a pair of ends, the smaller one decides, and you move the smaller side.
- Lesson: [Two Pointers — move the pointer that's already decided](../../learn/two-pointers/01-intro.md).

## Learning material
- **Water per column:** `water[i] = min(left_max[i], right_max[i]) - height[i]`, where both
  maxima include `height[i]` itself (so the result is never negative).
- **Prefix maximum:** `left_max[i] = max(left_max[i-1], height[i])` is one pass, O(n). The suffix
  maximum is the mirror image.
- **Why two pointers work:** keep `left_max` (the max of `height[0..left]`) and `right_max` (the
  max of `height[right..n-1]`). If `left_max <= right_max`, the true right maximum for `left` is at
  least `right_max >= left_max`, so the water at `left` is exactly `left_max - height[left]`.
- Reading: [Trapping Rain Water — the approaches compared (LeetCode)](https://leetcode.com/problems/trapping-rain-water/editorial/).

## Hints
<details><summary>Hint 1</summary>

For a single bar, how high can water stand above it? What two numbers decide that?
</details>
<details><summary>Hint 2</summary>

Precompute the max to the left and the max to the right of every index. Then it's a single sum,
O(n) time and O(n) space.
</details>
<details><summary>Hint 3</summary>

To get O(1) space: with pointers at both ends and running maxima, which side's water level do
you already know for sure?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`left = 0, right = n - 1, left_max = right_max = 0, total = 0`. While `left <= right`:
- If `height[left] <= height[right]`: `left_max = max(left_max, height[left])`, then
  `total += left_max - height[left]` and `left += 1`.
- Else do the mirror on the right: `right_max = max(right_max, height[right])`, then
  `total += right_max - height[right]` and `right -= 1`.

Time O(n), space O(1). (The prefix/suffix-max version is O(n) time and O(n) space. A
monotonic-stack version that fills water layer by layer is also O(n).)
</details>

## Follow-ups
- Solve it with a monotonic stack (horizontal layers instead of vertical columns).
- Trapping Rain Water II (LeetCode 407): a 2-D height map, solved with a min-heap from the
  border inward.
- Container With Most Water: pick one pair of walls instead of summing every column.
