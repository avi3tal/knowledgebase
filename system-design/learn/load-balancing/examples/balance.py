"""Worked example: assign requests to servers with round robin or least connections.

One request arrives per tick (request i at time i) and stays open for durations[i] ticks.
Returns which server got each request and the busiest any server ever was.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def balance(durations: list[int], servers: int, strategy: str) -> dict[str, object]:
    active = [0] * servers  # open connections per server
    ends: list[list[int]] = []  # [finish_time, server] of open requests
    assigned: list[int] = []
    peak = 0
    for i in range(len(durations)):
        for job in [j for j in ends if j[0] <= i]:
            active[job[1]] -= 1  # note: a request finished — its server frees a connection
            ends.remove(job)
        if strategy == "round-robin":
            target = i % servers  # note: round robin — next server in turn, ignoring how busy it is
        else:
            target = active.index(
                min(active)
            )  # note: least connections — pick the server with the fewest open requests
        active[target] += 1
        ends.append([i + durations[i], target])
        assigned.append(target)
        peak = max(peak, active[target])  # note: track the worst pile-up on any single server
    return {"assigned": assigned, "peak": peak}
