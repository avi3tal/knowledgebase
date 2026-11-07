# Reverse Nodes in k-Group

> Difficulty: **hard** · Patterns: in-place-reversal-linked-list, linked-list · Sources: [leetcode](https://leetcode.com/problems/reverse-nodes-in-k-group/)

## Problem
Given the `head` of a linked list and an integer `k`, reverse the nodes of the list `k` at a time
and return the new head. If the number of remaining nodes at the end is less than `k`, leave
them as they are. Rewire the nodes. Don't just swap their values.

## Examples
- `head = [1,2,3,4,5], k = 2` → `[2,1,4,3,5]`
- `head = [1,2,3,4,5], k = 3` → `[3,2,1,4,5]`
- `head = [1,2,3,4,5,6,7,8], k = 3` → `[3,2,1,6,5,4,7,8]`

## Constraints
- `1 <= k <= n <= 5000`, `0 <= Node.val <= 1000`
- Follow-up target: O(1) extra space.

## Pattern & how to recognise it
- "**Reverse** … every **k** nodes" → **In-place Reversal of a LinkedList**, applied block by
  block, with two reconnections per block.
- Pushing each block onto a stack is O(k) space. The recursive version is O(n/k) stack.
- Lesson: [In-place Reversal — variants](../../learn/in-place-reversal-linked-list/02-variants.md).

## Learning material
- Reversing one block is the sub-list reversal: flip `k` links, then connect the node
  **before** the block to the block's new front, and the block's new **last** node (its old
  first node) to the node **after** the block.
- A dummy head removes the special case where the first block changes the head.
- Check that `k` nodes remain **before** reversing a block.

## Hints
<details><summary>Hint 1</summary>

Solve "reverse nodes `p..q`" first. This problem repeats it.
</details>
<details><summary>Hint 2</summary>

For each block, which two nodes outside the reversal do you need to remember?
</details>
<details><summary>Hint 3</summary>

After a block is reversed, its old first node is the "node before" the next block.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dummy.next = head`, `group_prev = dummy`. Loop: find the `k`-th node after `group_prev` (stop if
it doesn't exist). Let `group_next = kth.next`. Reverse the block with `prev = group_next`,
`curr = group_prev.next` until `curr is group_next`. Then `first = group_prev.next`,
`group_prev.next = kth`, `group_prev = first`. Return `dummy.next`. Time O(n), space O(1).
</details>

## Follow-ups
- Reverse **alternating** k-blocks (reverse, skip, reverse, …).
- Also reverse the short final block.
