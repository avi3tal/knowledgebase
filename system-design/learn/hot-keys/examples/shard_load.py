"""Worked example: requests hashed onto cache shards, with and without splitting one hot key.

Each key goes to shard md5(key) % shards (a stable hash). With split > 1, the hot key is spread
over sub-keys "<key>#0" .. "<key>#<split-1>" round-robin (real systems pick at random), so its
traffic lands on several shards. Returns the request count per shard.
Reference code for the lesson animation; `# note:` comments become the narration.
"""

from hashlib import md5


def shard_of(key: str, shards: int) -> int:
    digest = md5(key.encode()).hexdigest()
    return int(digest[:8], 16) % shards


def shard_load(requests: list[str], hot: str, shards: int, split: int) -> list[int]:
    load = [0] * shards
    hot_seen = 0
    for i in range(len(requests)):
        key = requests[i]
        if key == hot and split > 1:
            key = hot + "#" + str(hot_seen % split)  # note: split: append a suffix so the hot key becomes several keys
            hot_seen += 1
        shard = shard_of(key, shards)
        load[shard] += 1  # note: watch one shard's count run away while the others idle
    return load
