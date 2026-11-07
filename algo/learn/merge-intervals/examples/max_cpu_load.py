"""Worked example (overlap count with a heap): maximum CPU load.

Each job is [start, end, load]. Sort by start; keep a min-heap of the jobs still running, keyed by
end time. Before a job starts, pop every job that has already ended. The heap is then exactly the
set of jobs that overlap the current one.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def max_cpu_load(jobs: list[list[int]]) -> int:
    jobs = sorted(jobs)  # note: sort by start time so we meet jobs in the order they begin
    running: list[tuple[int, int]] = []  # note: min-heap of (end, load) for the jobs still running
    load = best = 0
    for i in range(len(jobs)):
        start, end, job_load = jobs[i]
        while running and running[0][0] <= start:  # note: the earliest-ending job finished before this one starts
            _, done_load = heapq.heappop(running)  # note: evict it and drop its load
            load -= done_load
        heapq.heappush(running, (end, job_load))  # note: the new job joins the running set
        load += job_load
        best = max(best, load)  # note: the heap holds exactly the overlapping jobs — record the peak
    return best
