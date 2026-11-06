# Add Two Numbers

> Difficulty: **medium** · Patterns: linked-list, math · Sources: [leetcode](https://leetcode.com/problems/add-two-numbers/)

## Problem
Two non-negative integers are stored as linked lists of digits in **reverse order** (the head is
the ones digit). Add them and return the sum as a linked list in the same format. Neither number
has leading zeros, except the number 0 itself.

## Examples
- `[2,4,3]` + `[5,6,4]` → `[7,0,8]`: 342 + 465 = 807.
- `[0]` + `[0]` → `[0]`.
- `[9,9,9,9,9,9,9]` + `[9,9,9,9]` → `[8,9,9,9,0,0,0,1]`: the carry ripples all the way and adds a node.

## Constraints
- Each list has `1..100` nodes, digits `0..9`.
- 100 digits overflow 64-bit integers, so converting to numbers is not an option in Go/Java (Python
  could, but that misses the point).
- Target: O(max(m, n)) time, O(1) extra space besides the output list.

## Pattern & how to recognise it
- **Digits in a linked list, least significant first** → simulate grade-school addition while
  walking both lists at once, carrying into the next position.
- Building a new list node by node → **dummy head + tail pointer**.
- See [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Column addition:** at each position `s = x + y + carry`; output digit `s % 10`, new carry
  `s // 10`. The carry is always 0 or 1.
- **Uneven lengths:** treat a finished list as contributing `0`, so one loop handles everything.
- **Final carry:** after both lists end, a remaining carry of 1 becomes one extra node
  (99 + 1 = 100).
- **Dummy head:** `dummy = ListNode(); tail = dummy`, append with `tail.next = node; tail = node`,
  return `dummy.next`.

## Hints
<details><summary>Hint 1</summary>

The lists are already in the order you'd add digits by hand (ones first). What do you carry?
</details>
<details><summary>Hint 2</summary>

Loop while either list has nodes **or** a carry is left; treat a missing digit as 0.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Dummy head, `carry = 0`. While `l1 or l2 or carry`: take each list's digit (0 if exhausted),
`s = x + y + carry`, append `s % 10`, set `carry = s // 10`, advance the lists.
Return `dummy.next`. Time O(max(m, n)), space O(1) extra.
</details>

## Follow-ups
- Add Two Numbers II (LeetCode 445): digits are most-significant first — use two stacks, or
  reverse both lists.
- Do it recursively; compare stack usage.
- Multiply Strings (LeetCode 43): the same digit-by-digit arithmetic for multiplication.
