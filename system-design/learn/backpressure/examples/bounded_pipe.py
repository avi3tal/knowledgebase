"""Worked example: a fast producer, a slow consumer and a bounded queue between them.

arrivals[t] requests reach the producer at tick t; the consumer handles `rate` per tick;
the queue holds at most `capacity`. The policy decides what happens to the excess:
  "drop"  — shed whatever does not fit (load shedding),
  "block" — the producer waits, holding the excess in `pending`,
  "pace"  — the producer sends at most `rate` per tick (rate-limited at the source).
Returns served and dropped counts, the peak producer-side backlog and the ticks taken.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def bounded_pipe(arrivals: list[int], capacity: int, rate: int, policy: str) -> dict[str, int]:
    queue: list[str] = []
    pending: list[str] = []
    served, dropped, max_pending, next_id, tick = 0, 0, 0, 1, 0
    while tick < len(arrivals) or queue or pending:
        incoming = arrivals[tick] if tick < len(arrivals) else 0
        for _ in range(incoming):
            pending.append("r" + str(next_id))
            next_id += 1
        budget = rate if policy == "pace" else capacity
        while pending and len(queue) < capacity and budget > 0:
            queue.append(pending.pop(0))  # note: hand over only while there is room
            budget -= 1
        if policy == "drop":
            dropped += len(pending)  # note: shed the excess — cheap, but that work is lost
            pending = []
        max_pending = max(max_pending, len(pending))  # note: blocked work waits upstream
        for _ in range(min(rate, len(queue))):
            queue.pop(0)  # note: the consumer never holds more than it can handle
            served += 1
        tick += 1
    return {"served": served, "dropped": dropped, "max_pending": max_pending, "ticks": tick}
