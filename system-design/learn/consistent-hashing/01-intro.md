# Consistent Hashing

> Building block · Ideas: hash ring, virtual nodes, minimal remapping

You have N cache or storage servers and want every key to land on exactly one of them,
without asking a central directory each time. The obvious rule is

```
server = hash(key) % N
```

It spreads keys evenly, until N changes. Add a fifth server to four and almost every key's
`hash % N` changes, so roughly **(N−1)/N** of all keys move at once. For a cache that means a
sudden near-100% miss rate, a stampede onto the database. For a storage cluster it means
copying almost all the data.

Step through the naive scheme below: 8 keys, 3 servers grow to 4. Count how many keys end up
in `moved`.
