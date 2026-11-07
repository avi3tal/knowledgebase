# Palindrome Linked List

> Difficulty: **easy** · Patterns: linked-list, fast-slow-pointers, in-place-reversal-linked-list · Sources: [leetcode](https://leetcode.com/problems/palindrome-linked-list/)

## Problem
Given the `head` of a singly linked list, return `true` if the values read the same forwards
and backwards, and `false` otherwise.

## Examples
- `[1,2,2,1]` → `true`: reversed it's still `1,2,2,1`.
- `[1,2,3,2,1]` → `true`: the middle node `3` pairs with itself.
- `[1,2]` → `false`: `1` ≠ `2`.

## Constraints
- `1..10^5` nodes; values `0..9` on LeetCode. The cases here also use negatives. The list is never empty.
- Target: O(n) time and **O(1) extra space**. Copying the values into an array or using a stack is
  the easy O(n)-space answer. The follow-up asks you to avoid it.

## Pattern & how to recognise it
- **Palindrome on a singly linked list + O(1) space.** You can't walk backwards, and you can't
  index the middle. You need the **middle** without knowing the length → **fast & slow pointers**.
- Once you have the middle, the second half has to be read backwards. Reversing it in place is
  the **in-place reversal** pattern, used here as a helper.
- Naive: copy into an array and compare `a == a[::-1]`. That's O(n) time and O(n) space. It's fine
  as a first answer, but not the target.
- Lesson: [Fast & Slow Pointers](../../learn/fast-slow-pointers/01-intro.md), especially
  [finding the middle](../../learn/fast-slow-pointers/02-variants.md). Notes:
  [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Middle of a list:** `slow` moves 1 step and `fast` moves 2. When `fast` can't move any more,
  `slow` is halfway. The loop condition decides which middle you get on even lengths:
  `while fast and fast.next` stops on the second middle, and `while fast.next and fast.next.next`
  stops on the first (the last node of the first half). Each walk is O(n) time and O(1) space.
- **Reversing a list in place:** keep `prev`, `curr` and `next`, flip `curr.next = prev`, and
  advance. That's O(n) time and O(1) space.
- Restoring the list after you've reversed half of it is polite in interviews. Callers don't
  expect a read-only check to mutate their data.
- [Floyd's tortoise and hare (Wikipedia)](https://en.wikipedia.org/wiki/Cycle_detection#Floyd's_tortoise_and_hare)
- [Reverse Linked List (LeetCode 206)](https://leetcode.com/problems/reverse-linked-list/)

## Hints
<details><summary>Hint 1</summary>

Comparing the first half with the second half read *backwards* is enough. How would you
find where the second half starts, in one pass and without counting?
</details>
<details><summary>Hint 2</summary>

After finding the middle, reverse the second half in place. Now two forward pointers can
compare the halves.
</details>
<details><summary>Hint 3</summary>

On an odd length the middle node has no partner. Make sure your comparison loop stops on
the shorter half.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

1. Use fast/slow pointers to find the end of the first half: `slow` stops on the first middle.
2. Reverse the list that starts at `slow.next`.
3. Walk one pointer from `head` and one from the reversed second half, comparing values,
   until the second-half pointer runs out.
4. (Optional) Reverse the second half back and reattach it, then return the result.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Do it without modifying the list at all. Recursion works, but costs O(n) stack.
- Restore the list before returning.
- Reorder List (LeetCode 143) uses the same three steps: middle, reverse, merge.
- Palindrome check on a doubly linked list. It's trivial with two pointers from both ends
  (the two-pointers pattern).
