"""Worked example (linear recursion): sum of the decimal digits of a non-negative integer.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def digit_sum(n: int) -> int:
    if n < 10:
        return n  # note: base case: a single digit is its own sum — the calls stop going deeper
    last = n % 10  # note: split off the last digit…
    rest = digit_sum(n // 10)  # note: …and trust the same function to solve the smaller number (a new frame is pushed)
    return last + rest  # note: on the way back up, each frame adds its own digit to the answer from below
