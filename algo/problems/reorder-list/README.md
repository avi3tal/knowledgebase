# Reorder List

> Difficulty: **medium** · Patterns: linked-list, fast-slow-pointers, in-place-reversal-linked-list · Sources: [leetcode](https://leetcode.com/problems/reorder-list/)

## Problem
Given the `head` of a singly linked list `L0 → L1 → … → Ln-1 → Ln`, reorder it **in place** to

`L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …`

You may not change node values. Rewire the `next` pointers only. The function returns nothing.
The harness reads the list from `head` after the call.

## Examples
- `[1,2,3,4]` → `[1,4,2,3]`.
- `[1,2,3,4,5]` → `[1,5,2,4,3]`: the middle node `3` ends up last.
- `[1,2]` → `[1,2]`: nothing to interleave.

## Constraints
- `1..5·10^4` nodes; values `1..1000` on LeetCode. The cases here also use negatives.
- Target: O(n) time and **O(1) extra space**. Pushing the nodes into an array and re-linking from
  both ends is the O(n)-space answer.

## Pattern & how to recognise it
- The output interleaves the **front half** with the **back half reversed**. On a singly linked
  list that means: find the **middle** (→ **fast & slow pointers**), reverse the second half
  (**in-place reversal**), then merge the two halves alternately.
- O(1) space on a linked list with "halves" in the statement is the giveaway for fast/slow.
- Naive: copy the nodes into an array, then link `a[0], a[-1], a[1], a[-2], …`. That's O(n) time
  and O(n) space.
- Lesson: [Fast & Slow Pointers](../../learn/fast-slow-pointers/01-intro.md), especially
  [where slow stops on even lengths](../../learn/fast-slow-pointers/02-variants.md). Notes:
  [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Middle, then split:** to cut a list into two halves you want `slow` on the **last node of the
  first half**. Loop `while fast.next and fast.next.next`, then `second = slow.next;
  slow.next = None`. The first half gets the extra node on odd lengths.
- **In-place reversal:** `prev = None`. For each node, save `next`, point it at `prev`, and
  advance. That's O(n) time and O(1) space.
- **Merging two lists alternately:** save both `next` pointers before rewiring, or you lose the
  rest of a list.
- [Reorder List explanation (NeetCode)](https://neetcode.io/problems/reorder-linked-list)
- [Floyd's tortoise and hare (Wikipedia)](https://en.wikipedia.org/wiki/Cycle_detection#Floyd's_tortoise_and_hare)

## Hints
<details><summary>Hint 1</summary>

Look at the result: the even positions are the first half in order, and the odd positions
are the second half in *reverse* order.
</details>
<details><summary>Hint 2</summary>

Three O(1)-space steps you already know: find the middle, reverse a list, merge two lists.
</details>
<details><summary>Hint 3</summary>

Terminate the first half (`slow.next = None`) before reversing the second, or you'll build
a cycle.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

1. Fast/slow pointers with `while fast.next and fast.next.next`: `slow` ends on the last node
   of the first half.
2. Detach and reverse the second half: `second = reverse(slow.next)`, `slow.next = None`.
3. Merge: while `second` is not null, save `first.next` and `second.next`, link
   `first → second → old first.next`, and advance both.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Return a new list instead and leave the input untouched. What space does that cost?
- Reorder as `L0 → L1 → Ln → Ln-1 → L2 → L3 → …` (pairs).
- Palindrome Linked List (LeetCode 234) uses the same middle + reverse steps.
- Odd Even Linked List (LeetCode 328) is a different interleaving with no reversal.
