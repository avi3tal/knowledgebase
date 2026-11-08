## MVCC: readers don't block writers

PostgreSQL never updates a row in place. An `UPDATE` marks the current version as replaced
(sets its `xmax` to the writer's transaction id) and appends a **new version** whose `xmin` is
that id. Each transaction gets a **snapshot** when it starts: the set of transactions committed
at that moment. It sees exactly the versions created by those transactions and not yet replaced
by them.

| version of row a | xmin | xmax | T2 (snapshot {1}) | T4 (snapshot {1, 3}) |
|---|---|---|---|---|
| a = 10 | 1 | 3 | **visible** (3 not in snapshot) | replaced by 3 |
| a = 20 | 3 | 0 | created by 3: invisible | **visible** |

```figure
mvcc-snapshots
```

So a long report and a stream of updates run side by side without locking each other.

> [!NUMBERS] The cost: dead versions
> Every update leaves one dead version behind for `VACUUM` to reclaim.
> 5k updates/s × 86 400 s ≈ **430M dead tuples a day**. If autovacuum falls behind, the table
> bloats and scans slow down. A transaction left open for hours is worse: vacuum can't remove
> anything that snapshot might still need.

> [!TIP] Isolation level matters
> Under **read committed** (the default) the snapshot is taken per *statement*, not at BEGIN,
> so T2's SELECT (which runs after T3 commits) would already see 20. Under **repeatable read**
> the snapshot is taken once per transaction, which is what the figure and trace show.

Step through it below. T2 starts, T3 updates `a` and commits, yet T2 still reads the old value,
while T4, which started later, reads the new one.
