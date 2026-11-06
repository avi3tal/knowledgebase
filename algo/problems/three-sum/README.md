# 3Sum

> Difficulty: **medium** · Patterns: two-pointers, sorting · Sources: [leetcode](https://leetcode.com/problems/3sum/)

## Problem
Given an integer array `nums`, return all the **unique** triplets `[a, b, c]` of elements at
three different indices such that `a + b + c == 0`.

The answer must not contain duplicate triplets. The order of the triplets, and the order of the
numbers inside a triplet, don't matter.

## Examples
- `[-1,0,1,2,-1,-4]` → `[[-1,-1,2],[-1,0,1]]`. The triplet `[-1,0,1]` can be built two ways,
  using either `-1`, but it's listed once.
- `[0,1,1]` → `[]`: no triplet sums to zero.
- `[0,0,0]` → `[[0,0,0]]`.

## Constraints
- `0 <= n <= 3000`, and `-10^5 <= nums[i] <= 10^5`.
- With n = 3000, O(n³) is ~4.5·10⁹ triples, which is too slow. Aim for **O(n²)**.

## Pattern & how to recognise it
- **Triplets** + a **target sum** + "the order doesn't matter" → **sort, then two pointers**.
  Fix the first element with an outer loop. The problem becomes "pair with target sum
  `-nums[i]`" in the sorted suffix, which opposite-ends pointers solve in O(n).
- Sorting also makes **deduplication** easy: equal values sit next to each other, so you can
  skip them.
- Lesson: [Two Pointers](../../learn/two-pointers/01-intro.md) (the opposite-ends template, and
  triplets in the recognise section).

## Learning material
- **Sorting first:** O(n log n), which is dominated by the O(n²) search. Once the array is
  sorted, a pair sum that's too small can only grow by moving the left pointer right, and one
  that's too big can only shrink by moving the right pointer left.
- **Reducing k-sum to (k−1)-sum:** fix one element and solve the smaller problem on the rest.
  3Sum = n × (2Sum on a sorted array).
- **Skipping duplicates:** after using a value at some position, advance past every equal
  neighbour, both in the outer loop and for the inner pointers after recording a triplet.
- Reading: [3Sum (Wikipedia)](https://en.wikipedia.org/wiki/3SUM).

## Hints
<details><summary>Hint 1</summary>

If you fix `nums[i]`, what are you looking for among the remaining elements?
</details>
<details><summary>Hint 2</summary>

Sort the array. For each `i`, run the sorted pair-sum search on `i+1 .. n-1` with target
`-nums[i]`.
</details>
<details><summary>Hint 3</summary>

Duplicates: skip `i` if `nums[i] == nums[i-1]`. After recording a triplet, move both pointers
inward past equal values.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Sort. For `i` in `0..n-3`: skip it if it equals the previous value, and stop early if
`nums[i] > 0`. Set `left = i + 1, right = n - 1`. While `left < right`: let `s` be the sum of the
three. If `s < 0`, `left += 1`. If `s > 0`, `right -= 1`. Otherwise record the triplet, then move
`left` right and `right` left, skipping duplicates on both sides.

Time O(n²): the sort is O(n log n), plus n passes of O(n). Space O(1) extra, beyond the output
and the sort.
</details>

## Follow-ups
- 3Sum Closest (LeetCode 16): track the best `|s - target|` instead of exact matches.
- 3Sum Smaller: count triplets with sum < target. When it fits, count `right - left` at once.
- 4Sum / k-Sum: one more fixed loop per extra element, O(n^(k-1)).
- Without sorting: a hash set per `i` also gives O(n²), but deduplication is messier.
