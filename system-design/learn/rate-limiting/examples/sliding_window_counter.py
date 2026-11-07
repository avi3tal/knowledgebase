"""Worked example: sliding-window counter rate limiter (two fixed buckets, weighted).

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def sliding_window_counter(times: list[int], limit: int, window: int) -> list[str]:
    cur_start, cur_count, prev_count = 0, 0, 0
    decisions: list[str] = []
    for i in range(len(times)):
        now = times[i]
        start = now - now % window  # note: which fixed window does this request fall into?
        if start != cur_start:
            prev_count = (
                cur_count if start == cur_start + window else 0
            )  # note: new window — the old current becomes previous (or 0 if we skipped a whole window)
            cur_start, cur_count = start, 0
        elapsed = now - cur_start
        estimate = (
            prev_count * (window - elapsed) / window + cur_count
        )  # note: weight the previous window by how much of it still overlaps the sliding window
        if prev_count * (window - elapsed) + cur_count * window < limit * window:
            cur_count += 1  # note: estimate below the limit — allow and count it
            decisions.append("allow")
        else:
            decisions.append("reject")  # note: estimate at the limit — reject; rejected requests are not counted
    return decisions
