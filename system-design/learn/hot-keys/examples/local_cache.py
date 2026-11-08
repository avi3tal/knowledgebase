"""Worked example: a small in-process cache on each app server absorbing a hot key.

Request i arrives at tick i and is routed round-robin to server i % servers. Each server keeps
its own copy of a key for `ttl` ticks; only misses reach the shared cache shard.
Returns [local_hits, shard_reads].
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def local_cache(requests: list[str], servers: int, ttl: int) -> list[int]:
    local: dict[str, int] = {}  # "s<server>:<key>" -> tick the copy expires
    local_hits, shard_reads = 0, 0
    for i in range(len(requests)):
        server = i % servers
        slot = "s" + str(server) + ":" + requests[i]
        if slot in local and i < local[slot]:
            local_hits += 1  # note: served from this server's memory; the shard never sees it
            continue
        shard_reads += 1  # note: miss or expired copy: one read goes to the shard that owns the key
        local[slot] = i + ttl  # note: keep the copy for ttl ticks; staleness is bounded by ttl
    return [local_hits, shard_reads]
