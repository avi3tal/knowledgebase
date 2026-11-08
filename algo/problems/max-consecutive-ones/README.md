# Max Consecutive Ones

> Difficulty: **easy** · Patterns: arrays-hashing · Sources: [leetcode](https://leetcode.com/problems/max-consecutive-ones/)
## Problem
Given a binary array `nums`, return the length of the longest run of consecutive `1`s.

## Examples
- `[1,1,0,1,1,1]` → `3`.
- `[1,0,1,1,0,1]` → `2`.
- `[0,0,0]` → `0`.

## Constraints
- `1 <= n <= 10^5`, `nums[i]` is `0` or `1`. Target: one pass, O(1) space.

## Pattern & how to recognise it
- "Longest run" over a simple per-element condition → **one scan with a running counter** that
  resets. No map, no nested loop.
- Same shape as Boyer-Moore voting in [majority-element](../majority-element/README.md): one
  counter you bump, and a rule for what happens when the run breaks.
- Lesson: [Arrays & Hashing](../../learn/arrays-hashing/01-intro.md); its harder variants are
  **sliding window** problems.

## Learning material
- Two variables: `cur` (length of the run ending here) and `best`.
- `1` → `cur++`, then `best = max(best, cur)`; `0` → `cur = 0`.
- Update `best` inside the loop (or once more after it): forgetting the run that ends at the
  last element is the classic bug.

## Hints
<details><summary>Hint 1</summary>

What do you need to remember about the elements you've already passed? Only two numbers.
</details>
<details><summary>Hint 2</summary>

Make sure a run that ends at the last index still counts.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`cur = best = 0`; for each `x`: `cur = x == 1 ? cur + 1 : 0`; `best = max(best, cur)`. Return `best`.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- Max Consecutive Ones II: you may flip one `0` (sliding window with at most one zero).
- Max Consecutive Ones III: flip up to k zeros (sliding window, `sliding-window` lesson).
