"""Worked example: cache-aside reads, with and without invalidating the cache on writes.

ops are "r:<key>" (read) or "w:<key>=<value>" (write). Returns the number of stale reads,
i.e. reads whose answer differs from what the database holds at that moment.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def cache_aside(db: dict[str, int], ops: list[str], invalidate: bool) -> int:
    db = dict(db)  # work on a copy so the input is left unchanged
    cache: dict[str, int] = {}
    stale = 0
    for i in range(len(ops)):
        kind, rest = ops[i].split(":")
        if kind == "w":
            key, value = rest.split("=")
            db[key] = int(value)  # note: writes go to the database, the source of truth
            if invalidate:
                cache.pop(key, None)  # note: delete the cached copy so the next read reloads it
            continue
        key = rest
        if key not in cache:
            cache[key] = db[key]  # note: miss — load from the database and populate the cache
        answer = cache[key]
        if answer != db[key]:
            stale += 1  # note: stale read — the cache still holds the value from before the write
    return stale
