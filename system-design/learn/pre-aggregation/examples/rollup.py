"""Worked example: roll minute buckets up into hour buckets, keeping sum and count.

minutes are [minute, sum_latency_ms, request_count]. Hour rows are built by adding sums and
counts, so the hourly average stays exact. Averaging the per-minute averages instead gives a
wrong answer when minutes carry different amounts of traffic.
Returns [exact_avg, avg_of_avgs] for hour 0, both rounded down to whole ms.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def rollup(minutes: list[list[int]]) -> list[int]:
    hours: dict[int, list[int]] = {}
    minute_avgs: list[int] = []
    for i in range(len(minutes)):
        minute, total, count = minutes[i][0], minutes[i][1], minutes[i][2]
        hour = minute // 60  # note: the coarser window that contains this minute
        if hour not in hours:
            hours[hour] = [0, 0]
        hours[hour][0] += total  # note: sums and counts add up exactly across buckets
        hours[hour][1] += count
        if hour == 0:
            minute_avgs.append(total // count)  # note: a per-minute average, kept to compare
    first = hours[0]
    exact = first[0] // first[1]  # note: correct — total latency over total requests
    total_of_avgs = sum(minute_avgs)
    naive = total_of_avgs // len(minute_avgs)  # note: wrong — a quiet minute weighs as much as a busy one
    return [exact, naive]
