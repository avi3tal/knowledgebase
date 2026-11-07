# Bit Manipulation

> Fundamental · Data structures: integers as arrays of bits, bitmasks

An integer is a fixed row of bits, and the CPU can operate on all of them at once. Bit tricks turn
some O(n) loops into O(1) expressions, and let one integer stand for a whole **set** of up to 64
small items.

```
 44 = 0b101100        bit:  5 4 3 2 1 0
                            1 0 1 1 0 0
```

## The operators

| Expression | Meaning | Example (x = 0b101100 = 44) |
|---|---|---|
| `x & y` | AND: bits set in both | `x & 0b1111 = 0b1100` (12) |
| `x \| y` | OR: bits set in either | `x \| 1 = 0b101101` (45) |
| `x ^ y` | XOR: bits set in exactly one | `x ^ x = 0` |
| `~x` | NOT: flip every bit | `~x = -45` in two's complement |
| `x << k` | shift left = `x · 2^k` | `x << 1 = 88` |
| `x >> k` | shift right = `x // 2^k` | `x >> 2 = 11` |

## The single-bit toolkit

```python
(x >> k) & 1        # read bit k
x | (1 << k)        # set bit k
x & ~(1 << k)       # clear bit k
x ^ (1 << k)        # toggle bit k
x & (x - 1)         # clear the LOWEST set bit   (101100 → 101000)
x & -x              # isolate the lowest set bit (101100 → 000100)
x > 0 and x & (x - 1) == 0      # x is a power of two (exactly one set bit)
```

Why `x & (x − 1)` works: subtracting 1 turns the lowest `1` into `0` and every `0` below it into
`1`. ANDing with the original wipes out exactly that region.

## Template: loop over set bits only

```python
count = 0
while x:
    x &= x - 1          # drop one set bit per iteration
    count += 1
```

The loop runs once per **set** bit, not once per bit position. Below, watch `binary` lose its
rightmost `1` at every step.

## Language notes
- **Python ints are unbounded.** There's no overflow and no 32-bit wrap. A negative number
  behaves like infinitely many leading 1s, so `while x:` never ends for negative `x`. When a
  problem says "32-bit", mask with `& 0xFFFFFFFF`, and convert back with `x - (1 << 32)` if bit 31
  is set.
- **Go / Java / C** have fixed widths. Use unsigned types (`uint32`) for logical shifts. `>>` on a
  signed negative number copies the sign bit.
