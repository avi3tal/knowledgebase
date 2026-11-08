"""Worked example: tunable consistency on one key replicated to n nodes.

A write of version v reaches the first w replicas (indexes 0..w-1); a read asks the last r
replicas (indexes n-r..n-1) and keeps the highest version it sees. The read and write sets
overlap only when r + w > n. Returns the number of stale reads.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def quorum_reads(ops: list[str], n: int, w: int, r: int) -> int:
    replicas = [0] * n  # version held by each replica
    latest = 0
    stale = 0
    write_lo, write_hi = 0, w - 1
    read_lo, read_hi = n - r, n - 1
    for i in range(len(ops)):
        if ops[i] == "w":
            latest += 1
            for k in range(write_lo, write_hi + 1):
                replicas[k] = latest  # note: the coordinator acks once w replicas confirm
            continue
        seen = 0
        for k in range(read_lo, read_hi + 1):
            seen = max(seen, replicas[k])  # note: the newest timestamp among r replies wins
        if seen < latest:
            stale += 1  # note: stale — no replica in the read set saw the last write
        for k in range(read_lo, read_hi + 1):
            replicas[k] = seen  # note: read repair copies the winner to the replicas it read
    return stale
