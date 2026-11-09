## Variant 1: two numbers appear once, so split by a differing bit

If **two** values `a` and `b` appear once and the rest twice, the fold gives `a ^ b`. That's
not either value, but it's not useless. Any **1 bit** in `a ^ b` is a column where `a` and `b`
**differ**. So:

1. `xor_all = a ^ b` (fold the whole list).
2. Pick one set bit: `bit = xor_all & -xor_all` (the lowest set bit).
3. Split the numbers into two groups: those with that bit set, and those without. `a` and `b`
   land in **different** groups, and each pair lands together in one group.
4. Fold each group separately. Each group is now the single-number problem.

```text
xor_all = 0110  →  lowest set bit = 0010
group "bit set":   values with ?..1. → one of the singles + whole pairs
group "bit clear": values with ?..0. → the other single + whole pairs
```

`x & -x` isolates the lowest set bit in two's complement. In Python, integers are unbounded, so
it works for negatives too. In Go, use the same expression on `int`.

## Variant 2: flip bits with a mask

XOR with 1 **flips** a bit, and XOR with 0 **keeps** it. A mask of 1s therefore flips exactly
the bits you choose:
- **Complement of a number** (flip every bit of its binary form, ignoring leading zeros): build
  a mask of 1s as wide as the number, e.g. `5 = 101` → mask `111`, so `5 ^ 7 = 010 = 2`. Get
  the width from `x.bit_length()` (Go: `bits.Len`), or shift left until the mask covers `x`.
  Watch the edge case `0`: its binary form is `0`, one digit wide.
- **Invert a 0/1 value:** `v ^ 1` turns 0 into 1 and 1 into 0. Combine it with a two-pointer
  reversal of each row, and you can flip and invert an image in one pass per row.

## Variant 3: XOR as "difference detector"

- `a ^ b == 0` ⇔ `a == b`. `a ^ b` has a 1 exactly where they differ, so
  `(a ^ b).bit_count()` is the **Hamming distance**.
- **Swap without a temp:** `a ^= b; b ^= a; a ^= b`. Each step is invertible, so nothing is
  lost. (It breaks if `a` and `b` are the *same* memory slot, because `a ^= a` zeroes it.)
- **Find the extra character:** `t` is `s` with one extra letter shuffled in. XOR every
  character code of both strings, and the extra letter remains.

## Related bit tricks you'll meet alongside XOR

| expression | effect |
|---|---|
| `x & 1` | lowest bit (odd/even) |
| `x & (x - 1)` | clear the lowest set bit (count bits, power-of-two test) |
| `x & -x` | isolate the lowest set bit |
| `(x >> k) & 1` | read bit k |
| `x ^ (1 << k)` | flip bit k |
| `(1 << w) - 1` | a mask of `w` ones |
