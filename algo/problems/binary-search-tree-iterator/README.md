# Binary Search Tree Iterator

> Difficulty: **medium** · Patterns: multi-threaded, design, stack · Sources: [leetcode](https://leetcode.com/problems/binary-search-tree-iterator/)

## Problem
Implement `BSTIterator`, an iterator over the **in-order** traversal (ascending values) of a
binary search tree:
- `BSTIterator(root)` initialises the iterator. The pointer starts before the smallest value.
- `next()` moves to the next value and returns it.
- `hasNext()` returns `true` if a next value exists.

`next()` is only called when `hasNext()` would return `true`.

## Examples
`BSTIterator([7, 3, 15, null, null, 9, 20])`, then `next, next, hasNext, next, hasNext, next,
hasNext, next, hasNext` → `3, 7, true, 9, true, 15, true, 20, false`.

## Constraints
- `1 <= number of nodes <= 10^5`, `0 <= Node.val <= 10^6`, at most `10^5` calls.
- Target: `next()` and `hasNext()` in **amortised O(1)** time, using **O(h)** memory (h = tree
  height), not O(n).

## Pattern & how to recognise it
- The base problem is a **design** problem built on a **stack** (an in-order traversal paused
  between calls).
- It's in this lesson because of the DesignGurus **Multi-threaded** sample: a background thread
  can **prefetch** the next values into a bounded blocking queue while the caller works, so
  `next()` almost never waits.
- The tests are single-threaded and deterministic. Solve the stack version first.
- Lesson: [Multi-threaded](../../learn/multi-threaded/02-sync.md).

## Learning material
- **Pausing a recursion:** an iterative in-order traversal keeps an explicit stack of the nodes
  whose left side is being explored. Whatever is on the stack is "work still to do".
- **Amortised O(1):** a single call may do O(h) work, but each node is pushed and popped exactly
  once over the whole iteration.
- **Producer–consumer prefetch:** a producer thread pushes values into a bounded blocking queue
  (`queue.Queue(maxsize=k)` / a buffered channel), and `next()` takes from it.
- [In-order traversal (Wikipedia)](https://en.wikipedia.org/wiki/Tree_traversal#In-order,_LNR)

## Hints
<details><summary>Hint 1</summary>

Where is the smallest value? What do you have to remember on the way down so you can come back
up?
</details>
<details><summary>Hint 2</summary>

After returning a node's value, the next value lives in its right subtree (if any). How do you
find the smallest value there?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Constructor: push the left spine of `root` (go left until `None`, pushing each node).
`next()`: pop a node, push the left spine of `node.right`, return `node.val`. `hasNext()`:
the stack is non-empty. Concurrent follow-up: a producer thread runs the in-order traversal
and `put`s each value into a bounded queue, followed by a sentinel at the end. `next()` `get`s
values, and `hasNext()` peeks at whether the next item is the sentinel.

Expected complexity: time O(1) amortised per call, space O(h).

</details>

## Follow-ups
- Make it prefetch with a background thread and a bounded blocking queue. What bound keeps
  memory at O(k)? Who shuts the producer down if the caller stops early?
- Add `peek()` without consuming.
- Iterate in descending order, or merge two BST iterators (LeetCode 1305).
