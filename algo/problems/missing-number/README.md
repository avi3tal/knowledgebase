# Missing Number

> Difficulty: **easy** · Patterns: cyclic-sort, bitwise-xor · Sources: [leetcode](https://leetcode.com/problems/missing-number/)

## Problem
Given an array `nums` of `n` **distinct** numbers taken from the range `0..n`, return the one
number in the range that is missing from the array.

## Examples
- `nums = [3,0,1]` → `2`
- `nums = [0,1]` → `2` (`n = 2`, so the range is `0..2`)
- `nums = [9,6,4,2,3,5,7,0,1]` → `8`

## Constraints
- `1 <= n <= 10^4`, `0 <= nums[i] <= n`, all values distinct.
- Target: O(n) time and O(1) extra space.

## Pattern & how to recognise it
- Values in a range tied to the length (`0..n`) + "missing" → **Cyclic Sort**: put each value
  at its index, then find the slot that doesn't hold its own index. Value `n` has no slot, so
  skip it.
- Exactly **one** unknown and the rest present once → **Bitwise XOR** works too: XOR all
  indices `0..n` with all values, and every present number cancels.
- A set (O(n) space) or a sort (O(n log n)) also work but miss the target.
- Lessons: [Cyclic Sort](../../learn/cyclic-sort/01-intro.md),
  [Bitwise XOR](../../learn/bitwise-xor/01-intro.md).

## Learning material
- Cyclic sort: while `nums[i]` is in range and not at index `nums[i]`, swap it there. Each swap
  places one value for good, so the pass is O(n).
- XOR: `x ^ x = 0`, `x ^ 0 = x`, and order doesn't matter.
- The sum formula `n(n+1)/2 − sum(nums)` also works. In fixed-width integers, consider
  overflow.

## Hints
<details><summary>Hint 1</summary>

If nothing were missing, the array would hold exactly the values `0..n−1` plus `n`. Where would
each value "like" to sit?
</details>
<details><summary>Hint 2</summary>

Alternatively, pair every index with every value. Which number is left without a partner?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

**Cyclic sort:** for `i` in order, while `nums[i] < n` and `nums[i] != nums[nums[i]]`, swap
`nums[i]` to index `nums[i]`. Then the first `k` with `nums[k] != k` is the answer, or `n` if
there is none.

**XOR:** `acc = n`, then `acc ^= i ^ nums[i]` for every `i`. Return `acc`.

Both are O(n) time, O(1) space. The XOR version doesn't modify the array.
</details>

## Follow-ups
- All missing numbers, with duplicates present →
  [Find All Missing Numbers](../find-all-missing-numbers/README.md).
- Two numbers missing → XOR, then split by a differing bit
  ([Two Single Numbers](../two-single-numbers/README.md)).
