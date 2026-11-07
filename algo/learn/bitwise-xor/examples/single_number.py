"""Worked example: every number appears twice except one. Find it in O(n) time, O(1) space.

`binary` only exists for the animation: it shows x and acc as 4-bit strings so you can watch
the columns flip.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def single_number(nums: list[int]) -> int:
    acc = 0  # note: x ^ 0 = x, so 0 is the neutral start
    binary = {"x": "----", "acc": format(acc, "04b")}
    for i in range(len(nums)):
        x = nums[i]
        binary["x"] = format(x, "04b")  # note: XOR works bit by bit — compare the columns of x and acc
        acc ^= x  # note: each column flips where x has a 1; a second copy of x flips it back
        binary["acc"] = format(acc, "04b")
    return acc  # note: pairs cancelled (x ^ x = 0) and order didn't matter — only the single is left
