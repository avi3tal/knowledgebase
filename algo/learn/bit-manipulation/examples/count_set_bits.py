"""Worked example (Kernighan's trick): count the 1 bits of a non-negative integer.

`binary` only exists for the animation: it shows n as 8 bits so you can watch the lowest 1 vanish.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def count_set_bits(n: int) -> int:
    count = 0
    binary = list(format(n, "08b"))  # note: the binary form of n, shown for reference
    while n:
        lower = n - 1  # note: n - 1 flips the lowest 1 to 0 and every 0 below it to 1
        n &= lower  # note: n & (n - 1) clears exactly the lowest set bit
        binary[:] = format(n, "08b")
        count += 1  # note: one iteration per SET bit, not per bit position
    return count
