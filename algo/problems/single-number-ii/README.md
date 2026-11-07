# Single Number II

> Difficulty: **medium** · Patterns: bit-manipulation · Sources: [leetcode](https://leetcode.com/problems/single-number-ii/)

## Problem
In the integer array `nums`, every value appears **exactly three times** except one value, which
appears **exactly once**. Return that value. Use O(1) extra space.

## Examples
- `nums = [2, 2, 3, 2]` → `3`.
- `nums = [0, 1, 0, 1, 0, 1, 99]` → `99`.
- `nums = [-2, -2, 1, 1, 4, 1, 4, 4, -5, -2]` → `-5`.

## Constraints
- `1 <= nums.length <= 3 * 10^4`, `-2^31 <= nums[i] <= 2^31 − 1` (negatives included).
- A hash map of counts is O(n) space. Aim for O(n) time and O(1) space.

## Pattern & how to recognise it
- "Every element appears **k** times except one" with O(1) space → think **per bit**. The plain
  XOR trick only works for k = 2 (pairs cancel). For k = 3, count how many numbers have each bit
  set: that count mod 3 is the single number's bit.
- Lesson: [Bit Manipulation](../../learn/bit-manipulation/01-intro.md) (and
  [Bitwise XOR](../../learn/bitwise-xor/01-intro.md) for the k = 2 version).

## Learning material
- **Bit counting:** for bit `b` (0..31), `(x >> b) & 1` tells whether `x` has it. Sum over all
  numbers, take `% 3`, and set bit `b` in the answer if the remainder is 1.
- **Negative numbers in Python:** ints are unbounded, so after assembling 32 bits, a set bit 31
  means a negative value: subtract `2^32`. In Go or Java, `int32` handles it automatically.
- The two-variable `ones` / `twos` state machine does the same counting mod 3 for all bits in
  parallel. It's a nice follow-up.
- [Bitwise operation (Wikipedia)](https://en.wikipedia.org/wiki/Bitwise_operation)

## Hints
<details><summary>Hint 1</summary>

Look at a single bit position. If you add up that bit across all the numbers, what does the
total look like for the values that appear three times?
</details>
<details><summary>Hint 2</summary>

Do this for all 32 positions. How do you turn the 32 remainders back into a (possibly negative)
integer?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For `b` in 0..31: `count = sum((x >> b) & 1 for x in nums)`; if `count % 3`, set bit `b` in
`result`. Finally, if bit 31 is set, `result -= 1 << 32` (Python). The `ones`/`twos` version:
`ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones`, then return `ones`.

Expected complexity: time O(32 · n) = O(n), space O(1).

</details>

## Follow-ups
- Every element appears k times except one: generalise to `% k`.
- Two numbers appear once, the rest twice (Two Single Numbers, a Bitwise XOR problem).
