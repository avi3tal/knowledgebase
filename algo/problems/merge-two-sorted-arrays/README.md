# Merge Two Sorted Arrays (in place)

> Difficulty: **easy** · Patterns: two-pointers, sorting · Sources: [interviewbit](https://www.interviewbit.com/problems/merge-two-sorted-lists-ii/), [leetcode](https://leetcode.com/problems/merge-sorted-array/)

## Problem
Given two sorted integer arrays `a` and `b`, merge `b` **into `a`** so that `a` becomes one
sorted array. Return nothing; `a` is checked after the call.

## Examples
- `a = [1, 5, 8], b = [6, 9]` → `a` becomes `[1, 5, 6, 8, 9]`
- `a = [], b = [3, 4]` → `[3, 4]`
- `a = [1, 2, 2], b = [2, 2, 3]` → `[1, 2, 2, 2, 2, 3]`

## Constraints
- `0 <= len(a), len(b) <= 10^5`, values fit in 32 bits, both sorted ascending.
- Target O(n + m) time. Inserting into the middle of `a` is O(n) per insert → O(n·m).

## Pattern & how to recognise it
- **Two sorted inputs → two pointers**, as in the merge step of merge sort.
- **In place into the first array** → fill from the **back**: grow `a` to `n + m`, then write the
  larger of the two tails into the last free slot. Nothing unread is ever overwritten.

## Learning material
- Front-to-back merging in place forces shifting (`list.insert` is O(n)). Back-to-front avoids it:
  pointers `i = n-1`, `j = m-1`, `k = n+m-1`; place `max(a[i], b[j])` at `k`.
- When `a` runs out first, copy the rest of `b`; when `b` runs out, `a`'s prefix is already in
  place.
- LeetCode 88 editorial: https://leetcode.com/problems/merge-sorted-array/editorial/

## Hints
<details><summary>Hint 1</summary>

Where is there free space you can write into without destroying values you still need?
</details>
<details><summary>Hint 2</summary>

Extend `a` by `len(b)` and fill it from the end with the larger remaining element.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`a.extend([0] * m)`; `i, j, k = n-1, m-1, n+m-1`; while `j >= 0`: if `i >= 0 and a[i] > b[j]`:
`a[k] = a[i]; i -= 1` else `a[k] = b[j]; j -= 1`; `k -= 1`. Time O(n + m), space O(1) extra.
</details>

## Follow-ups
- The linked-list version → [Merge Two Sorted Lists](../merge-two-sorted-lists/README.md).
- Merge k sorted arrays (heap, O(N log k)).
- Intersection instead of union → [Intersection of Two Sorted Arrays](../intersection-of-sorted-arrays/README.md).
