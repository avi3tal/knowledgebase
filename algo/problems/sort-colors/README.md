# Sort Colors

> Difficulty: **medium** · Patterns: two-pointers, sorting · Sources: [leetcode](https://leetcode.com/problems/sort-colors/)

## Problem
You're given an array `nums` of `n` objects coloured red, white or blue, encoded as `0`, `1` and
`2`. Sort it **in place** so that objects of the same colour are adjacent, in the order red,
white, blue (all `0`s, then all `1`s, then all `2`s). Don't use the library sort.

## Examples
- `[2,0,2,1,1,0]` → `[0,0,1,1,2,2]`.
- `[2,0,1]` → `[0,1,2]`.
- `[1]` → `[1]`: a single element is already sorted.

## Constraints
- `1 <= n <= 300`, and `nums[i]` is `0`, `1` or `2`.
- Target: **one pass**, O(1) extra space. A two-pass counting sort is fine but isn't the point.

## Pattern & how to recognise it
- **In place** + **three groups** of values → **three pointers** (the Dutch national flag
  problem). It's a two-pointers variant: one boundary grows from the left, one from the right,
  and a scanning pointer moves between them.
- A comparison sort is O(n log n) and ignores that there are only three distinct values.
  Counting needs two passes. Partitioning does it in one.
- Lesson: [Two Pointers — three pointers / Dutch flag](../../learn/two-pointers/02-same-direction.md).

## Learning material
- **Partitioning in place:** keep invariants about regions of the array instead of building a new
  one. Here: everything left of `low` is `0`, everything right of `high` is `2`, the region
  `low..mid-1` is `1`, and `mid..high` is not yet examined.
- Each step looks at `nums[mid]` and shrinks the unexamined region by one, so the loop is O(n).
- A swap is O(1). The tricky part is which pointers to move after a swap: think about what you
  know about the element that was swapped *into* position `mid`.
- Reading: [Dutch national flag problem (Wikipedia)](https://en.wikipedia.org/wiki/Dutch_national_flag_problem).

## Hints
<details><summary>Hint 1</summary>

Counting sort works in two passes: count the 0s, 1s and 2s, then overwrite. Can you put each
element in its final region the moment you see it?
</details>
<details><summary>Hint 2</summary>

Keep three indices: `low` (the next slot for a 0), `high` (the next slot for a 2, from the
right) and `mid` (the element being examined).
</details>
<details><summary>Hint 3</summary>

After swapping with `high`, the element now at `mid` came from the unexamined region, so you
haven't looked at it yet. After swapping with `low`, you already know what it is.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`low = mid = 0`, `high = n - 1`. While `mid <= high`:
- `nums[mid] == 0`: swap `nums[low]` and `nums[mid]`, then `low += 1` and `mid += 1`.
- `nums[mid] == 1`: `mid += 1`.
- `nums[mid] == 2`: swap `nums[mid]` and `nums[high]`, then `high -= 1` only (re-examine the
  new `nums[mid]`).

Time O(n), one pass. Space O(1).
</details>

## Follow-ups
- Two-pass counting sort, and why one pass is preferred when the data is a stream.
- Partition around an arbitrary pivot into `< p`, `== p`, `> p` (the 3-way partition used in
  quicksort with many duplicates).
- k colours (Sort Colors II): recursive partitioning or counting, O(n log k).
