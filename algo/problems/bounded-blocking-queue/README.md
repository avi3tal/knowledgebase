# Design Bounded Blocking Queue

> Difficulty: **medium** · Patterns: multi-threaded, design · Sources: [leetcode](https://leetcode.com/problems/design-bounded-blocking-queue/)

## Problem
Implement a thread-safe FIFO queue with a fixed `capacity`:
- `BoundedBlockingQueue(capacity)` creates an empty queue.
- `enqueue(element)` adds `element` at the back. If the queue is **full**, the calling thread
  **blocks** until there is room.
- `dequeue()` removes and returns the front element. If the queue is **empty**, the calling
  thread **blocks** until an element arrives.
- `size()` returns the number of elements currently in the queue.

Multiple producer and consumer threads call these methods concurrently.

## Examples
`BoundedBlockingQueue(2)`, then `enqueue(1), enqueue(2), size(), dequeue(), enqueue(3), size(),
dequeue(), dequeue(), size()` → `null, null, 2, 1, null, 2, 2, 3, 0`.

## Constraints
- `1 <= capacity <= 30`, at most 40 calls per test.
- **The tests here are single-threaded and never block**: they don't dequeue from an empty
  queue or enqueue into a full one. They check FIFO order and `size`. Making it actually safe
  under concurrency (and blocking correctly) is on you. Test that separately with real threads.
- Don't solve it by wrapping `queue.Queue` (or a buffered channel in Go). Build it from a lock
  and condition variables (or semaphores).

## Pattern & how to recognise it
- "Thread-safe", "blocks until", producers and consumers → **Multi-threaded** (synchronisation
  design), not just a data-structure design.
- The data structure is trivial (a deque). The whole problem is *when a thread may proceed*.
- Lesson: [Multi-threaded](../../learn/multi-threaded/02-sync.md).

## Learning material
- **Mutex/lock:** only one thread at a time may touch the deque and the count.
- **Condition variable:** `wait()` atomically releases the lock and sleeps; `notify()` /
  `notify_all()` wakes waiters, who re-acquire the lock before continuing. Python:
  `threading.Condition`. Go: `sync.Cond` (or channels).
- **Semaphores** are an alternative: one counting free slots, one counting filled slots.
- There is a related file in this repo, `archive/concurrency/blocking_queue.py`. Read it
  critically: one of its two methods has a classic wake-up bug.
- [threading.Condition docs](https://docs.python.org/3/library/threading.html#condition-objects)

## Hints
<details><summary>Hint 1</summary>

Two things must be waited for: "not full" (producers) and "not empty" (consumers). What
should a thread do after it is woken up, before it touches the queue?
</details>
<details><summary>Hint 2</summary>

Why is `if queue_is_empty: wait()` wrong when there are two consumers?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

A deque plus one `Condition` (or two conditions, `not_full` and `not_empty`, sharing one lock).
`enqueue`: under the lock, `while len == capacity: wait()`, append, `notify_all()`. `dequeue`:
under the lock, `while len == 0: wait()`, pop left, `notify_all()`, return. `size`: return
the length under the lock. With two conditions you can `notify()` just the right side.

Expected complexity: time O(1) per call (excluding waiting), space O(capacity).

</details>

## Follow-ups
- Use two semaphores instead of a condition variable.
- Add `offer(element, timeout)` / `poll(timeout)` that give up after a deadline.
- Go: the same thing with `sync.Cond`, then with a buffered channel. Why is the channel version
  a one-liner?
- Write a real multi-threaded test: N producers and M consumers. Check that every item comes
  out exactly once and that `size()` never exceeds `capacity`.
