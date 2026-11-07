"""Worked example: an LRU cache in front of a slow store, replaying a stream of key reads.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def lru_hits_misses(requests: list[str], capacity: int) -> list[int]:
    cache: dict[str, str] = {}
    order: list[str] = []  # least recently used first, most recent last
    hits, misses = 0, 0
    for i in range(len(requests)):
        key = requests[i]
        if key in cache:
            hits += 1  # note: hit — served from memory, the database is not touched
            order.remove(key)
            order.append(key)  # note: move the key to the most-recent end
            continue
        misses += 1  # note: miss — read from the database (slow path)
        if len(cache) == capacity:
            victim = order.pop(0)  # note: cache full — evict the least recently used key
            del cache[victim]
        cache[key] = "row:" + key  # note: fill the cache so the next read of this key is a hit
        order.append(key)
    return [hits, misses]
