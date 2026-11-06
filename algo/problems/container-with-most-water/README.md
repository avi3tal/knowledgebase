# Container With Most Water

> Difficulty: **medium** · Patterns: two-pointers, greedy · Sources: [leetcode](https://leetcode.com/problems/container-with-most-water/)

## Problem
You're given an array `height` of `n` non-negative integers. Line `i` is a vertical wall from
`(i, 0)` to `(i, height[i])`. Pick two walls that, together with the x-axis, form a container,
and return the **maximum amount of water** it can hold. The water level is set by the shorter
wall, so the area of walls `i < j` is `(j - i) * min(height[i], height[j])`. You may not tilt the
container.

## Examples
- `[1,8,6,2,5,4,8,3,7]` → `49`: walls at index 1 (height 8) and index 8 (height 7) give
  width 7 × height 7.
- `[1,1]` → `1`.
- `[1,2,3,4,5]` → `6`: walls 2 and 4 give width 2 × height 3. That beats the widest pair
  (4 × 1 = 4).

## Constraints
- `2 <= n <= 10^5`, and `0 <= height[i] <= 10^4`.
- n up to 10⁵ rules out checking every pair (O(n²)). Aim for **O(n)**.

## Pattern & how to recognise it
- **Pair** of positions + the answer depends on both **ends** (the width) and the **smaller of
  the two** → **opposite-ends two pointers**. Start with the widest container and shrink it.
- The input is **not sorted**, but the width decreases monotonically as the pointers move
  inward. That's the order the argument relies on.
- Lesson: [Two Pointers — why throwing a candidate away is safe](../../learn/two-pointers/01-intro.md).

## Learning material
- **Dominated candidates:** with walls `left` and `right`, suppose `height[left] <= height[right]`.
  Every other container that uses `left` is **narrower** and **no taller** than
  `height[left]`, so none can beat the current one. `left` is done: move it.
- This is the same "safe discard" proof as pair-with-target-sum, applied to a max-area
  objective. That's why it's also tagged greedy: each step makes a locally forced choice.
- Reading: [LeetCode editorial discussion of the two-pointer proof](https://leetcode.com/problems/container-with-most-water/editorial/).

## Hints
<details><summary>Hint 1</summary>

Start with the widest container, the first and last walls. What limits its area?
</details>
<details><summary>Hint 2</summary>

If you move the taller wall inward, the width shrinks and the height can't go above the shorter
wall. Can that ever help?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`left = 0, right = n - 1, best = 0`. While `left < right`: update `best` with
`(right - left) * min(height[left], height[right])`, then move the pointer at the **shorter**
wall inward (either one on a tie). Return `best`.

Time O(n), space O(1).
</details>

## Follow-ups
- Prove the greedy move correct in an interview: the dominated-wall argument above.
- Trapping Rain Water: the same walls, but you sum the water over every column instead of
  picking one container.
- Return the pair of indices instead of the area.
