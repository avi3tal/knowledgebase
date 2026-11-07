# Two Single Numbers

> Difficulty: **medium** · Patterns: bitwise-xor · Sources: [leetcode](https://leetcode.com/problems/single-number-iii/)

## Problem
In an integer array `nums`, exactly **two** elements appear only once and every other element
appears exactly twice. Return the two single elements, in any order. Use O(n) time and O(1)
extra space.

## Examples
- `nums = [1,2,1,3,2,5]` → `[3,5]`
- `nums = [-1,0]` → `[-1,0]`
- `nums = [0,1]` → `[1,0]` (any order)

## Constraints
- `2 <= len(nums) <= 3 * 10^4`
- `-2^31 <= nums[i] <= 2^31 − 1`

## Pattern & how to recognise it
- "Every element appears **twice** except **two**" + O(1) space → **Bitwise XOR**: the fold
  cancels the pairs and leaves `a ^ b`, then a **differing bit** separates `a` from `b`.
- A counter or set works in O(n) space. Sorting is O(n log n).
- Lesson: [Bitwise XOR — variants](../../learn/bitwise-xor/02-variants.md).

## Learning material
- `x ^ x = 0`, `x ^ 0 = x`, XOR is commutative. Folding the whole array gives `a ^ b`.
- `a != b`, so `a ^ b` has at least one 1 bit, a position where they differ.
  `d & -d` isolates the lowest such bit.
- Every pair has equal bits, so both copies fall on the same side of any split.

## Hints
<details><summary>Hint 1</summary>

XOR everything together. What do you get, in terms of the two answers?
</details>
<details><summary>Hint 2</summary>

A 1 bit in that result is a position where the two answers differ. How could you use it to split
the array into two "single number" problems?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`d = XOR of all nums`. `bit = d & -d`. Then `a = XOR of the nums with (num & bit) != 0` and
`b = d ^ a`. Return `[a, b]`. Time O(n), space O(1).
</details>

## Follow-ups
- Every element appears **three** times except one (LeetCode 137): count bits modulo 3.
- Two numbers missing from `1..n`: XOR with `1..n`, then split the same way.
