"""Worked example (greedy matching of two sorted lists): the most children you can satisfy.

Child i is happy with a cookie of size >= needs[i]; each child gets at most one cookie.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def assign_cookies(needs: list[int], sizes: list[int]) -> int:
    needs, sizes = sorted(needs), sorted(sizes)  # note: sort both — smallest needs and smallest cookies first
    child = 0
    for cookie in range(
        len(sizes)
    ):  # note: try cookies smallest first; one too small for the next child fits nobody left
        if child < len(needs) and sizes[cookie] >= needs[child]:
            child += 1  # note: the smallest cookie that works goes to the least demanding child
    return child
