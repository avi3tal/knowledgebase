"""Worked example (interval scheduling): the maximum number of non-overlapping meetings.

Meetings that touch ([1, 3] and [3, 5]) don't overlap.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def max_meetings(meetings: list[list[int]]) -> int:
    meetings = sorted(
        meetings, key=lambda m: m[1]
    )  # note: sort by END time — the earliest finisher leaves the most room
    chosen: list[list[int]] = []
    last_end = float("-inf")
    for i in range(len(meetings)):
        start, end = meetings[i]
        if start >= last_end:
            chosen.append(meetings[i])  # note: it fits after the last chosen meeting — take it, never undo
            last_end = end  # note: the only state the greedy needs to remember
    return len(chosen)
