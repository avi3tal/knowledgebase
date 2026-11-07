"""Worked example (Euclid's algorithm): gcd and lcm of two positive integers.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def gcd_lcm(x: int, y: int) -> list[int]:
    a, b = x, y
    while b:
        remainder = a % b  # note: gcd(a, b) = gcd(b, a mod b) — any common divisor also divides the remainder
        a, b = b, remainder  # note: shift: the old divisor becomes the dividend
    gcd = a  # note: b hit 0 — gcd(a, 0) = a
    lcm = x // gcd * y  # note: lcm = x * y / gcd; divide first to keep the numbers small
    return [gcd, lcm]
