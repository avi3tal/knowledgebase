# Find the Duplicate Number

> Difficulty: **medium** · Patterns: fast-slow-pointers · Sources: [leetcode](https://leetcode.com/problems/find-the-duplicate-number/)

## Problem
`nums` has `n + 1` integers, each in the range `[1, n]`. Exactly one value is repeated. It may
appear two or more times. Return that value.

You must **not modify** the array, and you may use only **O(1) extra space**.

## Examples
- `[1,3,4,2,2]` → `2`.
- `[3,1,3,4,2]` → `3`.
- `[3,3,3,3,3]` → `3`: the duplicate can appear more than twice.

## Constraints
- `1 ≤ n ≤ 10^5`, `len(nums) == n + 1`, `1 ≤ nums[i] ≤ n`.
- Exactly one value repeats.
- Target: O(n) time and O(1) space, read-only. That rules out sorting (it mutates or copies), a hash
  set (O(n) space), and cyclic sort / sign-marking (they mutate).

## Pattern & how to recognise it
- **Values in `1..n` and indices in `0..n`:** every value is a valid index. So `i → nums[i]` is a
  **next-pointer**, and the array is a linked list in disguise (a *function graph*).
- Starting from index 0 and following `nums[...]`, you can never return to index 0, because no
  value is 0. The walk must eventually repeat. The node where the walk first repeats has two
  incoming arrows, which means two indices hold the same value: the duplicate.
- **Read-only + O(1) space + "a cycle must exist"** → **fast & slow pointers** (Floyd), including
  the second phase that finds where the cycle starts.
- Near misses: cyclic sort solves "find all duplicates" when you may modify the array, and a
  hash set solves it in O(n) space. Binary search on the value range ("how many values are ≤ mid?")
  is a valid O(n log n), O(1)-space alternative.
- Lesson: [Fast & Slow Pointers](../../learn/fast-slow-pointers/01-intro.md), especially
  [finding the cycle start and implicit sequences](../../learn/fast-slow-pointers/02-variants.md).

## Learning material
- **Floyd's cycle detection:** a tortoise moves 1 step and a hare moves 2. If a cycle exists they
  meet inside it, because the gap closes by exactly 1 per round. O(n) time, O(1) space.
- **Finding the entry of the cycle:** with tail length `a`, cycle length `c` and the meeting point
  `b` steps past the entry, `a + b` is a multiple of `c`. So `a ≡ −b (mod c)`: a pointer from the
  start and a pointer from the meeting point, both moving 1 step, meet at the entry.
- "Next" doesn't have to be a `.next` field. Any function from a finite set into itself works:
  `x → f(x)`.
- [Floyd's tortoise and hare (Wikipedia)](https://en.wikipedia.org/wiki/Cycle_detection#Floyd's_tortoise_and_hare)
- [LeetCode 142: Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/), the
  same algorithm on real nodes.

## Hints
<details><summary>Hint 1</summary>

Draw an arrow from every index `i` to index `nums[i]`. What shape do you get if you start
walking from index 0?
</details>
<details><summary>Hint 2</summary>

Which index has two arrows coming into it? Where is that node in the walk from index 0?
</details>
<details><summary>Hint 3</summary>

You need the *entry* of the cycle, not just any node in it. Remember the second phase of
Floyd's algorithm.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Treat `i → nums[i]` as a linked list starting at index 0.

1. Phase 1: `slow = nums[slow]` and `fast = nums[nums[fast]]` until they are equal (both start at 0
   and take at least one step).
2. Phase 2: reset `slow = 0`, then advance both by one step (`x = nums[x]`) until they are equal.
3. That index value is the cycle's entry, which is the duplicate.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Prove that at least one duplicate must exist (pigeonhole).
- Binary search on the answer: count how many values are `≤ mid`. That's O(n log n) time and O(1) space.
- If you may modify the array: negate `nums[abs(v)]` as a "seen" mark, or use cyclic sort.
- Find All Duplicates in an Array (LeetCode 442): many duplicates, mutation allowed → cyclic sort.
