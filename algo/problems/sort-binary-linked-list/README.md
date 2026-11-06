# Sort Binary Linked List

> Difficulty: **easy** · Patterns: linked-list, two-pointers · Sources: [interviewbit](https://www.interviewbit.com/problems/sort-binary-linked-list/)

## Problem
Given the `head` of a linked list whose values are only `0` and `1`, sort it so that all 0s
come before all 1s, and return the head.

## Examples
- `[1,0,0,1]` → `[0,0,1,1]`.
- `[0,1]` → `[0,1]` (already sorted).
- `[1,1,1,0,0]` → `[0,0,1,1,1]`.

## Constraints
- `0..10^5` nodes, each value `0` or `1`.
- Target: O(n) time, O(1) extra space. A general O(n log n) sort is too much work for two values.

## Pattern & how to recognise it
- **Only two (or three) distinct values** → no comparison sort is needed:
  - **Counting:** count the zeros in one pass, then overwrite the values in a second pass.
  - **Partition with two pointers:** keep a pointer to the first `1`; when you meet a `0`, swap
    values with it and advance that pointer (the Lomuto partition step from quicksort).
  - **Relinking:** build a 0-list and a 1-list with two dummy heads and join them. This one is
    stable and moves nodes instead of values.
- See [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Partition invariant:** everything before `one` is 0, everything from `one` up to the current
  node is 1. Swapping the current 0 with `one` and advancing `one` keeps the invariant.
- **Swap values vs relink nodes:** swapping values is simplest. Relinking is what you do when
  nodes carry other data, or when the problem forbids changing values.
- The array version is Sort Colors / the Dutch national flag (LeetCode 75), with three values and
  three pointers.

## Hints
<details><summary>Hint 1</summary>

With only two values, how much information do you need to rebuild the sorted list?
</details>
<details><summary>Hint 2</summary>

Try one pass that remembers where the first `1` is.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Count zeros, then rewrite the first `zeros` values as 0 and the rest as 1 (two passes). Or, in one
pass, keep `one` = the first node holding 1; on each 0 after it, swap values with `one` and set
`one = one.next`. Time O(n), space O(1).
</details>

## Follow-ups
- Three values: Sort List of 0s, 1s and 2s (Dutch national flag on a list) — three dummy heads.
- Partition List (LeetCode 86): move nodes `< x` before the others, keeping relative order.
- Odd Even Linked List (LeetCode 328): the same two-dummy-heads relinking.
