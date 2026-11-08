"""Worked example: a wide-column table partitioned by conversation and clustered by seq.

rows are [partition_key, clustering_key, body]. Each partition keeps its rows sorted by the
clustering key. queries are "p:<partition>:<n>" (latest n rows of one partition) or
"body:<text>" (find rows by a non-key column, which has to visit every partition).
Returns [partitions_touched, rows_read] per query.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def partition_layout(rows: list[list], queries: list[str]) -> list[list[int]]:
    table: dict[str, list[int]] = {}
    bodies: dict[str, str] = {}
    for i in range(len(rows)):
        pk, ck = rows[i][0], rows[i][1]
        bodies[pk + "/" + str(ck)] = rows[i][2]
        if pk not in table:
            table[pk] = []  # note: a new partition key hashes to its own place on the ring
        part = table[pk]
        pos = len(part)
        while pos > 0 and part[pos - 1] > ck:
            pos -= 1
        part.insert(pos, ck)  # note: rows inside a partition stay sorted by the clustering key
    result: list[list[int]] = []
    for q in range(len(queries)):
        kind, arg = queries[q].split(":", 1)
        if kind == "p":
            pk, n = arg.split(":")
            part = table[pk]
            count = int(n)
            latest = part[-count:]  # note: one partition, one contiguous slice from the end
            result.append([1, len(latest)])
            continue
        touched, read, matches = 0, 0, 0
        for pk in table:
            touched += 1  # note: no partition key in the query, so every partition is visited
            for ck in table[pk]:
                read += 1
                if bodies[pk + "/" + str(ck)] == arg:
                    matches += 1  # note: a match, but only after reading every row
        result.append([touched, read])
    return result
