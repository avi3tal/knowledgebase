"""Worked example: a queue absorbs a bursty producer while a consumer works at a steady rate.

arrivals[t] messages are published at tick t; the consumer handles up to `rate` per tick.
Returns [max queue depth, tick at which the queue is empty again].
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def buffer_burst(arrivals: list[int], rate: int) -> list[int]:
    queue: list[str] = []
    next_id, max_depth, tick = 1, 0, 0
    while tick < len(arrivals) or queue:
        incoming = arrivals[tick] if tick < len(arrivals) else 0
        for _ in range(incoming):
            queue.append(
                "m" + str(next_id)
            )  # note: producer publishes and returns immediately — it never waits for the consumer
            next_id += 1
        max_depth = max(
            max_depth, len(queue)
        )  # note: queue depth (consumer lag) — the metric to alert and autoscale on
        for _ in range(min(rate, len(queue))):
            queue.pop(0)  # note: consumer takes the oldest message at its own steady pace
        tick += 1
    return [max_depth, tick]
