"""Worked example (heap of tuples): a single CPU always runs the shortest available job next.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def shortest_job_first(jobs: list[list[int]]) -> list[int]:
    order = sorted(range(len(jobs)), key=lambda j: jobs[j][0])  # note: job ids by arrival time
    ready: list[tuple[int, int]] = []  # note: min-heap of (duration, job id): ties break on the id
    time, k, done = 0, 0, []
    while len(done) < len(jobs):
        while k < len(order) and jobs[order[k]][0] <= time:
            job = order[k]
            heapq.heappush(ready, (jobs[job][1], job))  # note: every job that has arrived joins the heap
            k += 1
        if not ready:
            time = jobs[order[k]][0]  # note: CPU idle — jump the clock to the next arrival
            continue
        duration, job = heapq.heappop(ready)  # note: the root is the shortest ready job
        time += duration
        done.append(job)  # note: run it to completion; more jobs may have arrived meanwhile
    return done
