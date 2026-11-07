# Merge Two Sorted Lists

> Difficulty: **easy** · Patterns: linked-list, two-pointers · Sources: [leetcode](https://leetcode.com/problems/merge-two-sorted-lists/), [educative](https://www.educative.io/courses/data-structures-coding-interviews-python)

## Problem
You're given the heads of two **sorted** singly linked lists, `list1` and `list2`. Merge them into
one sorted list by splicing together the nodes of the inputs, and return its head. Duplicates
are kept.

## Examples
- `[1,2,4]` + `[1,3,4]` → `[1,1,2,3,4,4]`
- `[]` + `[]` → `[]`
- `[]` + `[0]` → `[0]`

## Constraints
- Each list has `0..50` nodes, values in `-100..100`, both sorted non-decreasing.
- Target: one pass, O(n + m) time, O(1) extra space (reuse the existing nodes).

## Pattern & how to recognise it
- **Two sorted sequences, produce one sorted sequence** → the **merge step of merge sort**: a
  pointer in each input, always take the smaller head.
- **Linked list output built incrementally** → use a **dummy (sentinel) head**, so the first node
  needs no special case. Append to a `tail` pointer and return `dummy.next`.
- See [algo/notes/linked-lists.md](../../notes/linked-lists.md) and
  [algo/notes/sorting/merge_sort.md](../../notes/sorting/merge_sort.md).

## Learning material
- **Dummy head:** `dummy = ListNode(); tail = dummy`. Every append is `tail.next = node;
  tail = node`. This removes the "is the result empty yet?" branch.
- **Splicing vs copying:** re-linking existing nodes gives O(1) extra space; allocating new
  nodes is O(n + m) space.
- When one list runs out, attach the rest of the other list in one step (it's already sorted).
- A recursive version is elegant, but it uses O(n + m) stack and can hit recursion limits.

## Hints
<details><summary>Hint 1</summary>

Compare the two current heads. Which one must come first in the output?
</details>
<details><summary>Hint 2</summary>

A placeholder node in front of the result means the head needs no special case.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Dummy head plus tail pointer. While both lists are non-empty, attach the smaller head and
advance that list. Then attach whichever list is left. Return `dummy.next`.
Time O(n + m), space O(1).
</details>

## Follow-ups
- [Merge **k** Sorted Lists](../merge-k-sorted-lists/README.md) (LeetCode 23): a min-heap of heads, O(N log k).
- Merge sorted arrays in place (LeetCode 88): fill from the back.
- Sort a linked list (LeetCode 148): merge sort using this merge.
- Arrays version, merging into the first array → [Merge Two Sorted Arrays](../merge-two-sorted-arrays/README.md).
