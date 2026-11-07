# Rotate List

> Difficulty: **medium** · Patterns: in-place-reversal-linked-list, linked-list · Sources: [leetcode](https://leetcode.com/problems/rotate-list/)

## Problem
Given the `head` of a linked list, rotate the list to the **right** by `k` places: the last `k`
nodes move, in order, to the front. Return the new head.

## Examples
- `head = [1,2,3,4,5], k = 2` → `[4,5,1,2,3]`
- `head = [0,1,2], k = 4` → `[2,0,1]` (4 rotations of a 3-node list = 1 rotation)
- `head = [], k = 3` → `[]`

## Constraints
- `0 <= number of nodes <= 500`, `-100 <= Node.val <= 100`
- `0 <= k <= 2 * 10^9`, so `k` can be far larger than the list.

## Pattern & how to recognise it
- Re-arrange a linked list **in place** by rewiring `next` pointers → **In-place Reversal of a
  LinkedList** family (DesignGurus' "Rotate a LinkedList"). No node is copied.
- Rotating one step at a time is O(n·k). `k` up to 2·10⁹ makes that hopeless.
- Lesson: [In-place Reversal — variants](../../learn/in-place-reversal-linked-list/02-variants.md).

## Learning material
- Rotating by `n` (the length) is a no-op, so only `k mod n` matters.
- Rotating right by `k` means the node at position `n − k` becomes the head, and the node just
  before it becomes the tail.
- Joining the tail to the head turns the list into a ring. Then rotation is just "cut the ring
  in the right place".

## Hints
<details><summary>Hint 1</summary>

You need the length anyway. What else do you learn on the walk that measures it?
</details>
<details><summary>Hint 2</summary>

Which node becomes the new tail, in terms of `n` and `k mod n`?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Handle empty or single-node lists. Walk to the tail, counting `n`. `k %= n`. If `k == 0`, return
`head`. Link `tail.next = head`. Walk `n − k − 1` steps from `head` to the new tail. Set
`new_head = new_tail.next` and `new_tail.next = None`. Time O(n), space O(1).
</details>

## Follow-ups
- Rotate left by `k`.
- Rotate an array by `k` in place with three reversals (see `rotate-array`).
