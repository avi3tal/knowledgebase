# Middle of the Linked List

> Difficulty: **easy** · Patterns: linked-list, fast-slow-pointers · Sources: [leetcode](https://leetcode.com/problems/middle-of-the-linked-list/)

## Problem
Given the `head` of a singly linked list, return the **middle node**. If there are two middle
nodes (even length), return the **second** one. The answer is the sub-list starting at that node.

## Examples
- `[1,2,3,4,5]` → `[3,4,5]`: node 3 is the middle.
- `[1,2,3,4,5,6]` → `[4,5,6]`: two middles (3 and 4); return the second.
- `[7]` → `[7]`.

## Constraints
- `1..100` nodes (LeetCode); values `1..100`. The list is never empty.
- Target: one pass, O(n) time, O(1) extra space — no counting pass, no copying into an array.

## Pattern & how to recognise it
- **"Middle", "k-th from the end", "cycle" on a singly linked list** with no length given →
  **fast & slow pointers**. The fast pointer moves 2 steps for every 1 of the slow pointer, so
  when fast reaches the end, slow is halfway.
- The naive way counts the length first and walks again (two passes) or copies into an array
  (O(n) space). Both are fine asymptotically; the pointer trick is the expected one-pass answer.
- See [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Tortoise and hare:** `slow = fast = head`; while `fast` and `fast.next` exist:
  `slow = slow.next; fast = fast.next.next`. The loop condition decides which middle you get:
  testing `fast and fast.next` gives the **second** middle; testing `fast.next and fast.next.next`
  gives the **first** middle (used when splitting a list for merge sort).
- Walk through lengths 1, 2, 3 and 4 by hand to convince yourself — off-by-one bugs live here.
- Same technique: Linked List Cycle (Floyd), Palindrome Linked List (find middle + reverse).
- [Floyd's cycle-finding (Wikipedia)](https://en.wikipedia.org/wiki/Cycle_detection#Floyd's_tortoise_and_hare)

## Hints
<details><summary>Hint 1</summary>

If one pointer moves twice as fast as another, where is the slow one when the fast one finishes?
</details>
<details><summary>Hint 2</summary>

Check the loop condition on a 2-node list: which node should `slow` end on?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`slow = fast = head`; while `fast` is not null and `fast.next` is not null, advance slow by one
and fast by two. Return `slow`. Time O(n), space O(1).
</details>

## Follow-ups
- Return the **first** middle for even lengths (change the loop condition).
- Delete the middle node (LeetCode 2095): keep a pointer to the node before `slow`.
- Palindrome Linked List (LeetCode 234): find the middle, reverse the second half, compare.
- Linked List Cycle II (LeetCode 142): same two pointers, find where the cycle starts.
