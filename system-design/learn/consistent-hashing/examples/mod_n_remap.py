"""Worked example: naive `hash(key) % N` placement, and what moves when N grows by one.

Key hashes are given as small integers so the arithmetic is easy to follow.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def mod_n_remap(key_hashes: dict[str, int], n_before: int, n_after: int) -> list[str]:
    owner: dict[str, int] = {}
    for key in key_hashes:
        owner[key] = key_hashes[key] % n_before  # note: place every key on server hash % N
    moved: list[str] = []
    for key in key_hashes:
        new_server = key_hashes[key] % n_after  # note: one server added — recompute hash % (N+1) for every key
        if new_server != owner[key]:
            moved.append(key)  # note: different server — this key must be migrated (or is a cache miss)
        owner[key] = new_server
    return moved
