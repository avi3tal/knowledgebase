"""Worked example: a producer routes keyed events to the partitions of a topic.

partition = hash(key) % partitions, so every event with the same key lands in the same
partition and keeps its order there. An offset is a position in one partition's log.
Returns the partition logs (each entry "key:value").
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def partition_by_key(events: list[list[str]], partitions: int) -> list[list[str]]:
    logs: list[list[str]] = []
    for _ in range(partitions):
        logs.append([])  # note: a topic is N independent append-only logs
    p, offset = None, None
    for key, value in events:
        h = 0
        for ch in key:
            h += ord(ch)  # note: a stable hash of the key (Kafka uses murmur2)
        p = h % partitions  # note: same key → same partition, every time
        offset = len(logs[p])  # note: the next offset is the current length of the log
        logs[p].insert(offset, key + ":" + value)  # note: write at the tail; offsets never move
    return logs
