## Bitmasks as sets

With a small universe (26 letters, ≤ 20 items), an int can **be** a set: bit k means "item k is in".
Set operations become single instructions:

| Set operation | Bitmask |
|---|---|
| add item k | `mask \| (1 << k)` |
| contains k? | `mask >> k & 1` |
| union / intersection | `a \| b` / `a & b` |
| disjoint? | `a & b == 0` |
| size | `bin(mask).count("1")` (or `mask.bit_count()`) |
| every subset of {0..n−1} | `for mask in range(1 << n)` |
| every subset of `mask` | `sub = mask; while sub: …; sub = (sub - 1) & mask` |

Typical uses:
- **Letter sets:** do two words share a letter? Build one 26-bit mask per word, then a single
  `&` per pair instead of a set intersection. The animation does exactly this.
- **Bitmask DP:** states like `dp[mask][last]` over ≤ ~20 items (travelling salesman, assigning
  tasks to workers). The mask records "which items are used". That's the Dynamic Programming
  topic, with bits as the state encoding.
- **Enumerating combinations** when n ≤ 20: loop `mask` over `range(1 << n)`.

## Counting per bit position

When values repeat a fixed number of times, look at **one bit position at a time** across all
numbers. If every value except one appears 3 times, the count of ones at each position is
`3·something + (bit of the single value)`, so `% 3` recovers it. XOR is just the `% 2` special
case, covered in the **Bitwise XOR** lesson.

## Building numbers bit by bit
- **Reverse / rotate bits:** read with `n & 1`, shift `n` right, append to the result with
  `(r << 1) | bit`. Run a fixed 32 times.
- **Fast power:** `x^n` reads the bits of n. Square the base at each step and multiply it in when
  the bit is 1, for O(log n) multiplications.
- **Add without `+`:** `a ^ b` is the sum without carries and `(a & b) << 1` is the carry. Repeat
  until the carry is 0, masking to 32 bits in Python.
