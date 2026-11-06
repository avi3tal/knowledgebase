# LRU Cache

> Difficulty: **medium** · Patterns: design, hashmap, linked-list · Sources: [leetcode](https://leetcode.com/problems/lru-cache/), interview:classic

## Problem
Design a **Least Recently Used** cache with a fixed capacity:
- `LRUCache(capacity)` creates the cache.
- `get(key)` returns the value for `key`, or `-1` if it's absent. A hit makes `key` the most
  recently used.
- `put(key, value)` inserts or updates `key`, which becomes the most recently used. If an insert
  pushes the size above `capacity`, evict the **least** recently used key first.

Both operations must run in **O(1)** time on average.

## Examples
`LRUCache(2)`, then `put(1,1)`, `put(2,2)`, `get(1) → 1`, `put(3,3)` (evicts key 2),
`get(2) → -1`, `put(4,4)` (evicts key 1), `get(1) → -1`, `get(3) → 3`, `get(4) → 4`.

## Constraints
- `1 <= capacity <= 3000`, keys `0..10^4`, values `0..10^5`, up to `2·10^5` calls.
- Target: O(1) per operation, O(capacity) space. A list plus `remove`/`insert(0)` is O(n) per
  operation and too slow.

## Pattern & how to recognise it
- **O(1) lookup** → a hash map. **O(1) "move to front" and "remove the oldest"** → a **doubly
  linked list** ordered by recency. Combine them: the map points from key to list node.
- This is a classic **design** question. Interviewers look for the two-structure combination, for
  sentinel nodes, and for keeping the two structures in sync on every path (hit, miss, update,
  eviction).
- See [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **Doubly linked list with sentinels:** `head <-> ... <-> tail`, with dummy `head`/`tail` nodes
  so insert and unlink never special-case an empty list. Unlinking a node you hold a pointer to is
  O(1): `node.prev.next = node.next; node.next.prev = node.prev`.
- **The node stores the key as well as the value.** On eviction you pop the LRU node from the
  list and must delete `map[node.key]`. A common bug is deleting the key that is being inserted.
- **Order of operations in `put`:** update or insert, move to the front, then evict if over capacity.
- Python shortcut: `collections.OrderedDict` with `move_to_end` and `popitem(last=False)`. Know it,
  but also be ready to build the list by hand.
- [LRU cache (Wikipedia)](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU)

## Hints
<details><summary>Hint 1</summary>

A hash map alone can't tell you which key is the oldest. A list alone can't find a key in O(1).
What if you use both?
</details>
<details><summary>Hint 2</summary>

To move a node in O(1) you need its predecessor. Which kind of linked list gives you that?
</details>
<details><summary>Hint 3</summary>

When you evict the tail node, how do you know which map entry to delete?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Use a hash map `key -> node` and a doubly linked list with sentinel `head` (most recent) and `tail`
(least recent); each node holds `key` and `value`. `get`: on a miss return -1; on a hit unlink
the node, re-insert it after `head` and return its value. `put`: if the key exists, update the
value and move it to the front. Otherwise create a node, insert it at the front and add it to the
map; if the size now exceeds capacity, unlink `tail.prev` and delete its key from the map.
O(1) per operation, O(capacity) space.
</details>

## Follow-ups
- LFU Cache (LeetCode 460): evict the least *frequently* used, with frequency buckets of LRU lists.
- Thread safety: one lock around both structures, or a segmented/sharded cache.
- TTL expiry and size-in-bytes capacity, as in real caches (Redis, Guava, groupcache).
- Implement it in Go with `container/list` plus a `map[int]*list.Element`.
