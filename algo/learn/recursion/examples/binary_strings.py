"""Worked example (tree recursion): every binary string of length n.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def binary_strings(n: int) -> list[str]:
    out: list[str] = []

    def build(prefix: str) -> None:
        if len(prefix) == n:
            out.append(prefix)  # note: base case: the string is complete — record it and return
            return
        build(prefix + "0")  # note: branch 1: put a 0 here, recurse on the remaining positions
        build(prefix + "1")  # note: branch 2: the first branch has fully returned — now try a 1

    build("")  # note: two calls per level → 2^n leaves; depth is only n
    return out
