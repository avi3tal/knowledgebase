"""Worked example: a consumer group reads partitions, commits offsets, and rebalances.

Each partition is owned by one consumer of the group. Every round the owner polls up to
`batch` records from its committed offset, processes them, then commits. In round
`crash_round` the consumer `crash` processes its batch but dies before committing; the group
rebalances and the new owner re-reads from the last committed offset (at-least-once).
Returns how many records were processed and how many of those were duplicates.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def consumer_group(
    logs: list[list[str]], consumers: list[str], batch: int, crash: str, crash_round: int
) -> dict[str, int]:
    committed: dict[int, int] = {}
    owner: dict[int, str] = {}
    alive = list(consumers)
    total = 0
    for p in range(len(logs)):
        committed[p] = 0
        owner[p] = alive[p % len(alive)]  # note: one owner per partition inside a group
        total += len(logs[p])
    processed: list[str] = []
    rnd, off = 0, None
    while sum(committed.values()) < total:
        for p in range(len(logs)):
            start = committed[p]  # note: poll resumes from the committed offset
            end = min(start + batch, len(logs[p]))
            for off in range(start, end):
                processed.append(logs[p][off])
            if owner[p] == crash and rnd == crash_round:
                continue  # note: crashed after processing, before the commit
            committed[p] = end  # note: commit = "done up to here"
        if rnd == crash_round:
            alive.remove(crash)  # note: heartbeats stop → the group rebalances
            for p in range(len(logs)):
                owner[p] = alive[p % len(alive)]
        rnd += 1
    return {"processed": len(processed), "duplicates": len(processed) - total}
