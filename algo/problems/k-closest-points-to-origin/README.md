# K Closest Points to Origin

> Difficulty: **medium** · Patterns: top-k-elements, heap · Sources: [leetcode](https://leetcode.com/problems/k-closest-points-to-origin/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
Given an array of `points` where `points[i] = [x_i, y_i]` is a point on the plane, and an integer
`k`, return the `k` points closest to the origin `(0, 0)`. Distance is the Euclidean distance
`sqrt(x² + y²)`.

Return the points in **any order**. The test cases have a unique answer (no tie at the k-th
distance).

## Examples
- `points = [[1,3],[-2,2]], k = 1` → `[[-2,2]]`: distances are √10 and √8.
- `points = [[3,3],[5,-1],[-2,4]], k = 2` → `[[3,3],[-2,4]]` (in any order).

## Constraints
- `1 <= k <= len(points) <= 10^4`, `-10^4 <= x_i, y_i <= 10^4`.
- Sorting all points is O(n log n). With k much smaller than n, a size-k heap does O(n log k).

## Pattern & how to recognise it
- "The **k closest**" = the k **smallest** by a key (distance) from an unsorted collection → **Top
  'K' Elements**.
- For the k smallest, keep a **max**-heap of size k: its top is the farthest point you're keeping,
  the first to go when a closer point arrives.
- Lesson: [Top 'K' Elements](../../learn/top-k-elements/01-intro.md).

## Learning material
- Compare **squared** distances `x² + y²`. Squaring preserves the order, and it avoids float noise
  from `sqrt`.
- Python's `heapq` is a min-heap: push `(-dist, x, y)` for a max-heap by distance. `heapreplace`
  pops the top and pushes in one O(log k) step.
- Quickselect on the distances is O(n) on average if you only need the answer once.

## Hints
<details><summary>Hint 1</summary>

You need k points. Once you hold k candidates, which one should a new, closer point replace?
</details>
<details><summary>Hint 2</summary>

Keep the candidates in a heap whose top is the **farthest** candidate. Python only has a min-heap,
so negate the key.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For each point, `d = x*x + y*y`. If the heap has fewer than k entries, push `(-d, x, y)`. Else if
`d < -heap[0][0]`, `heapreplace` with `(-d, x, y)`. Return the points left in the heap.

Time O(n log k), space O(k).
</details>

## Follow-ups
- Points arrive as a stream: same heap, answer at any time.
- k closest to an arbitrary point `(px, py)`: just change the key.
- Return them sorted by distance: pop the heap and reverse.
