# Remove Duplicates from Sorted List

> Difficulty: **easy** · Patterns: linked-list · Sources: [leetcode](https://leetcode.com/problems/remove-duplicates-from-sorted-list/), [interviewbit](https://www.interviewbit.com/problems/remove-duplicates-from-sorted-list/)

## Problem
Given the `head` of a **sorted** linked list, delete duplicates so each value appears only once.
Return the head of the resulting (still sorted) list. Relink the existing nodes; don't build a new list.

## Examples
- `[1,1,2]` → `[1,2]`.
- `[1,1,2,3,3]` → `[1,2,3]`.
- `[]` → `[]`.

## Constraints
- `0..300` nodes, values `-100..100`, sorted non-decreasing.
- Target: one pass, O(n) time, O(1) extra space.

## Pattern & how to recognise it
- **Sorted** means duplicates are **adjacent**, so you only ever compare a node with its
  successor. No hash set is needed.
- Deleting from a singly linked list = **bypass** the node: `cur.next = cur.next.next`.
- See [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Bypass deletion:** to delete the node after `cur`, point `cur.next` past it. You can only
  delete the *next* node, so stand on the node before the one you remove.
- **Only advance when there's nothing to delete.** If you advance right after a deletion, you skip
  comparing the new neighbour, so runs of 3 or more equal values survive.
- Unsorted input would need a hash set (O(n) space), or sorting first.

## Hints
<details><summary>Hint 1</summary>

In a sorted list, where are all copies of a value?
</details>
<details><summary>Hint 2</summary>

Stand on a node. While its next node has the same value, unlink that next node.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`cur = head`. While `cur` and `cur.next`: if `cur.next.val == cur.val`, set
`cur.next = cur.next.next`; otherwise `cur = cur.next`. Return `head`. Time O(n), space O(1).
</details>

## Follow-ups
- Remove Duplicates from Sorted List II (LeetCode 82): drop **every** value that appears more
  than once. Needs a dummy head because the head itself can be removed.
- Unsorted list: a hash set of seen values (O(n) space), or O(n²) with no extra space.
- Remove Duplicates from Sorted Array (LeetCode 26): the same idea with a write index.
