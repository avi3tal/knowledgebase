# Smallest Range Covering Elements from K Lists

> Difficulty: **hard** · Patterns: k-way-merge, heap · Sources: [leetcode](https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
You have `k` lists of integers, each sorted in non-decreasing order. Find the **smallest range**
`[a, b]` that includes **at least one number from each** of the k lists.

Range `[a, b]` is smaller than `[c, d]` if `b - a < d - c`, or if `b - a == d - c` and `a < c`.
Return `[a, b]`.

## Examples
- `nums = [[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]` → `[20, 24]`: 24 is in list 0, 20 in list 1
  and 22 in list 2.
- `nums = [[1,2,3],[1,2,3],[1,2,3]]` → `[1, 1]`.

## Constraints
- `1 <= k <= 3500`, `1 <= len(nums[i]) <= 50`, `-10^5 <= nums[i][j] <= 10^5`.
- Every list is non-empty.
- Trying every pair of endpoints is O(N²) or worse. Aim for O(N log k), N = total length.

## Pattern & how to recognise it
- "At least one element **from each of k sorted lists**" → **K-way Merge** with exactly one
  element per list in the heap.
- The heap gives the **minimum** of the current picks. Track the **maximum** separately. The
  current range is `[min, max]`.
- Lesson: [K-way Merge](../../learn/k-way-merge/01-intro.md) (Variant 2 in the variants).

## Learning material
- With one element per list chosen, the smallest range containing them is `[min, max]` of the
  choice.
- To shrink it you can only **raise the minimum**: lowering the max would mean dropping an element
  you need. So advance the list that holds the minimum.
- The same idea is a sliding window over the merged, list-tagged sequence (window must contain
  all k tags).

## Hints
<details><summary>Hint 1</summary>

Pick the first element of every list. That's a valid range. Which single change could make it
smaller?
</details>
<details><summary>Hint 2</summary>

Replace the minimum with the next element of its list. Keep the minimum in a heap and the maximum in
a variable.
</details>
<details><summary>Hint 3</summary>

When must you stop?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Push `(nums[i][0], i, 0)` for every list and set `cur_max` to the largest of them. Loop: look at
the top `(v, i, j)`. If `cur_max - v` beats the best, record `[v, cur_max]`. If `j + 1` is past
the end of list i, stop. Otherwise pop it, push `(nums[i][j + 1], i, j + 1)` and update `cur_max`.

Time O(N log k), space O(k).
</details>

## Follow-ups
- Return the actual elements chosen from each list.
- The lists are unsorted: sort them first, or merge into one tagged list and use a sliding window
  with counts.
- Cover at least m of the k lists (not all).
