# Remove the K-th Node From the End

> Difficulty: **medium** · Patterns: linked-list, fast-slow-pointers · Sources: [leetcode](https://leetcode.com/problems/remove-nth-node-from-end-of-list/)

## Problem
Given the `head` of a singly linked list and an integer `k`, remove the **k-th node from the end**
of the list and return the head of the resulting list. `k = 1` is the last node. (LeetCode calls
the parameter `n`.)

## Examples
- `head = [1,2,3,4,5], k = 2` → `[1,2,3,5]`: the 2nd from the end is `4`.
- `head = [1], k = 1` → `[]`: the only node is removed.
- `head = [1,2], k = 2` → `[2]`: the head itself is removed.

## Constraints
- `1..30` nodes on LeetCode. The cases here go up to 7. Values `0..100` on LeetCode.
- `1 ≤ k ≤ length of the list`.
- Target: **one pass**, O(n) time, O(1) extra space. Counting the length first and then walking
  again is the two-pass answer.

## Pattern & how to recognise it
- **"k-th from the end" on a singly linked list** with no length given → two pointers on the same
  list with a fixed **offset**. It's the same-speed cousin of fast & slow pointers: the leader
  gets a k-node head start, then both move 1 step at a time.
- When the leader hits the end, the follower is exactly k nodes behind it. That puts it just
  before the node to remove, if you set it up right.
- Removing the **head** is the edge case that breaks naive code. A **dummy node** before the head
  makes every removal look the same.
- Naive: count the length L, then walk L − k steps. It's O(n) and fine, but takes two passes.
- Lesson: [Fast & Slow Pointers](../../learn/fast-slow-pointers/01-intro.md) and its note on
  [a pointer with a head start](../../learn/fast-slow-pointers/02-variants.md). Notes:
  [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Offset pointers:** if `lead` is k nodes ahead of `trail` and both move one step per round, the
  gap stays at k. When `lead` falls off the end, `trail` is the k-th node from the end. That's O(n)
  time and O(1) space.
- **Dummy (sentinel) head:** `dummy.next = head`. Start both pointers at `dummy` and return
  `dummy.next`. Deleting the real head is then just `prev.next = prev.next.next`.
- To delete a node in a singly linked list you need the node **before** it. Aim `trail` there.
- [Sentinel node (Wikipedia)](https://en.wikipedia.org/wiki/Sentinel_node)
- [Remove Nth Node From End of List (LeetCode 19)](https://leetcode.com/problems/remove-nth-node-from-end-of-list/)

## Hints
<details><summary>Hint 1</summary>

If you knew the length L, which node would you stop on? Now do it without knowing L.
</details>
<details><summary>Hint 2</summary>

Move one pointer k steps ahead first. Then move both together. Where is the trailing pointer
when the leading one reaches the last node?
</details>
<details><summary>Hint 3</summary>

Test `k == length` (removing the head). A dummy node in front of the head removes the
special case.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

1. `dummy.next = head`; `lead = trail = dummy`.
2. Advance `lead` k times.
3. While `lead.next` is not null, advance both `lead` and `trail`.
4. `trail.next` is the k-th node from the end. Unlink it with `trail.next = trail.next.next`.
5. Return `dummy.next`.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Return the k-th node from the end instead of removing it.
- What if `k` may exceed the length? Detect it during the head-start walk.
- Rotate List (LeetCode 61) uses the same offset trick to find the new tail.
- Swapping Nodes in a Linked List (LeetCode 1721): swap the k-th from the start with the k-th from the end.
