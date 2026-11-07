"""Worked example (choose / explore / un-choose): k distinct digits 1..9 that add up to n.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def combination_sum3(k: int, n: int) -> list[list[int]]:
    result: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int, remaining: int) -> None:
        if len(path) == k:
            if remaining == 0:
                result.append(path[:])  # note: k digits that hit the target — record a copy of the path
            return  # note: path is full — go back up
        for digit in range(start, 10):
            if digit * (k - len(path)) > remaining:
                break  # note: prune — the open slots need at least this digit each, and digits only grow, so stop
            path.append(digit)  # note: choose
            backtrack(digit + 1, remaining - digit)  # note: explore — only bigger digits, smaller budget
            path.pop()  # note: un-choose — undo the move before trying the next digit

    backtrack(1, n)
    return result
