## Reading the result

| number | value | so what |
|---|---|---|
| write QPS | ~23 /s | trivial for one primary; writes aren't the problem |
| peak read QPS | ~17 000 /s | too much for one DB: cache metadata, add read replicas |
| read : write | ~250 : 1 | strongly read-heavy, so optimise the read path first |
| storage | ~5 500 TB ≈ 5.5 PB | photos go to blob/object storage; only metadata goes in a DB |
| egress | ~23 Gbps | serve images from a CDN, not from your servers |

Notice that the **photo bytes** and the **metadata rows** have completely different numbers.
Estimate them separately. A metadata row is about 1 KB, so 2 M uploads/day is only 2 GB/day,
which fits a single database for years.

## Writing estimates in the practice console
The console's **estimates** stage is a small calculator: each row has a `name`, a `formula`
and a `unit`. Rows are evaluated top to bottom, and a formula may use earlier row names and the
constants `thousand`, `million`, `billion`, and `day`, `hour`, `month` (in seconds). The same
photo app as rows:

```
uploads_per_day   10 * million / 5                           (count)
write_qps         uploads_per_day / day                      /s
read_qps          10 * million * 50 / day                    /s
peak_read_qps     read_qps * 3                               /s
storage_total     uploads_per_day * 500 * thousand * 365 * 5 * 3   B     → ~5.5e15 B ≈ 5.5 PB
egress            read_qps * 500 * thousand                  B/s   → ~2.9 GB/s ≈ 23 Gbps
```

A row's value is read **in its own unit**: a `B/s` row holds bytes per second, and the
console converts between units for the checks. If you'd rather use a `Gbps` row, the formula itself
must produce gigabits per second: `read_qps * 500 * thousand * 8 / billion`.

Name rows after what they mean (`write_qps`, `storage_total`). The checks look for estimates
by name and test whether the value lands in a sensible range once converted to the unit.
