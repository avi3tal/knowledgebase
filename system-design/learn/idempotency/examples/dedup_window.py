"""Worked example: an at-least-once consumer that dedups message ids in a bounded "seen" table.

messages is the delivery stream; redeliveries repeat an id. The consumer remembers only the last
`window` ids (like a TTL on the dedup table). Returns [processed, dropped, slipped]: handled,
recognised as duplicates, and duplicates that got processed again because their id had expired.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def dedup_window(messages: list[str], window: int) -> list[int]:
    seen: dict[str, int] = {}
    handled: dict[str, int] = {}
    processed = 0
    dropped = 0
    slipped = 0
    for i in range(len(messages)):
        msg = messages[i]
        if msg in seen:
            dropped += 1  # note: id still in the dedup table — ack and skip, no second side effect
            continue
        if msg in handled:
            slipped += 1  # note: a duplicate the table forgot — the window was shorter than the redelivery delay
        processed += 1
        handled[msg] = i
        seen[msg] = i  # note: record the id with the processing (same transaction in a real system)
        if len(seen) > window:
            ids = iter(seen)
            oldest = next(ids)
            del seen[oldest]  # note: bounded memory — the oldest id expires from the dedup table
    return [processed, dropped, slipped]
