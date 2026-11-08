"""Worked example: per-user counters with INCR + EXPIRE, and Redis expiring keys on its own.

requests are "<second>:<user>". Each user gets a key "hits:<user>"; the first INCR in a window
sets a TTL, and once the TTL has passed the key is gone and the count starts again at 1.
Returns [allowed, rejected] for a limit of `limit` requests per `ttl` seconds.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def counter_ttl(requests: list[str], limit: int, ttl: int) -> list[int]:
    store: dict[str, int] = {}
    expires_at: dict[str, int] = {}
    allowed, rejected = 0, 0
    for i in range(len(requests)):
        second, user = requests[i].split(":")
        now = int(second)
        key = "hits:" + user
        if key in expires_at and now >= expires_at[key]:
            del store[key]  # note: TTL reached, so Redis has deleted the key itself; no cleanup job needed
            del expires_at[key]
        count = store.get(key, 0) + 1
        store[key] = count  # note: INCR hits:<user> is atomic and returns the new value in one round trip
        if count == 1:
            expires_at[key] = now + ttl  # note: EXPIRE only on the first hit, so the window starts here
        if count <= limit:
            allowed += 1
        else:
            rejected += 1  # note: over the limit until the key expires
    return [allowed, rejected]
