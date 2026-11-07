# Reverse Linked List

> Difficulty: **easy** · Patterns: in-place-reversal-linked-list, linked-list · Sources: [leetcode](https://leetcode.com/problems/reverse-linked-list/)

## Problem
Given the `head` of a singly linked list, reverse the list in place and return the new head.

## Examples
- `head = [1,2,3,4,5]` → `[5,4,3,2,1]`
- `head = [1,2]` → `[2,1]`
- `head = []` → `[]`

## Constraints
- `0 <= number of nodes <= 5000`, `-5000 <= Node.val <= 5000`
- Target: O(n) time, O(1) extra space.

## Pattern & how to recognise it
- "**Reverse**" + singly linked list + no extra space → **In-place Reversal of a LinkedList**,
  the base template the other variants build on.
- Copying the values into an array or onto a stack works, but it's O(n) space.
- Lesson: [In-place Reversal](../../learn/in-place-reversal-linked-list/01-intro.md).

## Learning material
- Three pointers: `prev` (the reversed part), `curr` (the node being flipped) and `next` (the
  rest, saved before the link is cut).
- Each node's `next` is rewritten exactly once: O(n) time, O(1) space.
- A recursive version is shorter, but it uses O(n) stack.

## Hints
<details><summary>Hint 1</summary>

If you set `curr.next = prev` right away, how do you reach the rest of the list?
</details>
<details><summary>Hint 2</summary>

When the loop ends, which pointer holds the new head?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`prev = None, curr = head`. While `curr`: `nxt = curr.next; curr.next = prev; prev = curr;
curr = nxt`. Return `prev`. Time O(n), space O(1).
</details>

## Follow-ups
- Write it recursively, and explain why it isn't O(1) space.
- Reverse only positions `left..right` (LeetCode 92).
