"""Worked example: MVCC row versions and snapshots, simplified from how PostgreSQL does it.

Each row version is [key, value, xmin, xmax]: xmin is the transaction that created it, xmax the one
that replaced it (0 = still current). Transaction 1 loaded the initial rows and has committed.
ops are "<tx>:begin", "<tx>:commit", "<tx>:get:<key>" or "<tx>:set:<key>=<value>".
A transaction sees a version if its creator had committed when the transaction began (or is itself)
and its replacer had not. Returns what each get read, as "<tx>:<key>=<value>".
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def mvcc(rows: dict[str, int], ops: list[str]) -> list[str]:
    versions: list[list] = []
    for key in rows:
        versions.append([key, rows[key], 1, 0])
    committed = {1: True}
    snaps: dict[int, dict[int, bool]] = {}
    reads: list[str] = []
    for i in range(len(ops)):
        parts = ops[i].split(":")
        tx = int(parts[0])
        if parts[1] == "begin":
            snaps[tx] = dict(committed)  # note: the snapshot = which transactions had committed at BEGIN
            continue
        if parts[1] == "commit":
            committed[tx] = True  # note: commit just marks the txid committed; no rows are copied or moved
            continue
        key = parts[2].split("=")[0]
        snap = snaps[tx]
        seen = -1
        for j in range(len(versions)):
            v = versions[j]
            born = v[0] == key and (v[2] == tx or v[2] in snap)
            dead = v[3] == tx or v[3] in snap
            if born and not dead:
                seen = j  # note: this version is visible to tx under its own snapshot
        if parts[1] == "get":
            reads.append(f"{tx}:{key}={versions[seen][1]}")  # note: readers never block: each reads its snapshot
            continue
        value = int(parts[2].split("=")[1])
        versions[seen][3] = tx  # note: an UPDATE doesn't overwrite: it stamps the old version's xmax...
        versions.append([key, value, tx, 0])  # note: ...and appends a new version; vacuum removes dead ones later
    return reads
