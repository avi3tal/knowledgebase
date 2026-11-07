"""Worked example: place keys on shards by key range or by key hash, and count keys per shard.

Range mode: boundaries[i] is the first key of shard i+1 (sorted). Hash mode: crc32(key) % shards
(a stable hash, unlike Python's per-process salted hash()).
Reference code for the lesson animation; `# note:` comments become the narration.
"""

from bisect import bisect_right
from zlib import crc32


def stable_hash(key: str) -> int:
    return crc32(key.encode())


def partition(keys: list[str], mode: str, shards: int, boundaries: list[str]) -> list[int]:
    placement: dict[str, int] = {}
    counts = [0] * shards
    for i in range(len(keys)):
        key = keys[i]
        if mode == "range":
            shard = bisect_right(
                boundaries, key
            )  # note: range — find which key range this key falls into; neighbours stay together
        else:
            shard = (
                stable_hash(key) % shards
            )  # note: hash — scramble the key, then take it mod the shard count; neighbours scatter
        placement[key] = shard
        counts[shard] += 1  # note: watch the per-shard load build up
    return counts
