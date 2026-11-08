# Majority Element Ii

> Difficulty: **medium** · Patterns: arrays-hashing · Sources: [leetcode](https://leetcode.com/problems/majority-element-ii/)
## Problem
Given an integer array `nums` of size `n`, return **all** values that appear **more than
`⌊n/3⌋` times**, in any order. There may be zero, one or two of them.

Stretch problem: do [majority-element](../majority-element/README.md) first.

## Examples
- `[3,2,3]` → `[3]`.
- `[1,2]` → `[1,2]` (each appears once, `⌊2/3⌋ = 0`).
- `[1,1,2,2,3,3]` → `[]`: exactly n/3 is not *more than* n/3.

## Constraints
- `1 <= n <= 5·10^4`. Follow-up: O(n) time, O(1) space.

## Pattern & how to recognise it
- "More than n/k times" → counting; O(1) space → **Boyer-Moore with k-1 candidates**.
- At most **two** values can each have more than n/3 of the votes (three would exceed n).
- Lesson: [Arrays & Hashing](../../learn/arrays-hashing/01-intro.md).

## Learning material
- Keep two `(candidate, count)` pairs. For each `x`:
  1. `x` equals candidate 1 → `count1++`; else equals candidate 2 → `count2++`;
  2. else if `count1 == 0` → take `x` as candidate 1 (count 1); else if `count2 == 0` → candidate 2;
  3. else `x` cancels one vote from **both** (`count1--`, `count2--`).
- Order of the checks matters: test "equals a candidate" **before** "a slot is empty", otherwise
  the same value can occupy both slots.
- **No guarantee here**, so the survivors are only *candidates*: do a second pass that counts them
  and keep those with count > n/3. This is the key difference from majority-element.

## Hints
<details><summary>Hint 1</summary>

How many values can appear more than n/3 times at most?
</details>
<details><summary>Hint 2</summary>

Run voting with two candidates; a new value cancels one vote from each.
</details>
<details><summary>Hint 3</summary>

The survivors might not qualify. Verify them.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Pass 1: two-candidate voting as described. Pass 2: count both candidates (skip candidate 2 if it
equals candidate 1), return those with count > n/3.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- Generalise to n/k with k-1 candidates (Misra–Gries heavy hitters).
- Hash map version first (O(n) space), then optimise.
