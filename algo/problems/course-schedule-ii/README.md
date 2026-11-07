# Course Schedule II

> Difficulty: **medium** · Patterns: topological-sort · Sources: [leetcode](https://leetcode.com/problems/course-schedule-ii/)

## Problem
There are `numCourses` courses labelled `0 … numCourses - 1`. `prerequisites[i] = [a, b]`
means course `b` must be taken **before** course `a`. Return **an ordering** of all courses
that respects every prerequisite. If there are several, return **any** of them. If it is
impossible, return an **empty list**.

## Examples
- `numCourses = 2, prerequisites = [[1, 0]]` → `[0, 1]`.
- `numCourses = 4, prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]` → `[0, 1, 2, 3]` or
  `[0, 2, 1, 3]`.
- `numCourses = 2, prerequisites = [[1, 0], [0, 1]]` → `[]`.

## Constraints
- `1 <= numCourses <= 2000`, `0 <= len(prerequisites) <= numCourses * (numCourses - 1)`.
- `a != b` in LeetCode, but here a self-loop may appear and makes the answer `[]`.
- All pairs `[a, b]` are distinct in LeetCode. Don't rely on that.
- Any valid order is accepted (the tests list every valid order).

## Pattern & how to recognise it
- Dependencies + "return an order" → **Topological Sort**.
- The "impossible" case is a cycle in the directed graph.
- Lesson: [Topological Sort](../../learn/topological-sort/01-intro.md).

## Learning material
- **Kahn's algorithm** produces the order directly: the order in which nodes leave the queue.
  If fewer than `n` nodes leave it, there's a cycle.
- **DFS reverse post-order** is the alternative: a node is finished only after everything it
  unlocks is finished.
- Watch the edge direction: `[a, b]` is an edge **b → a**.
- [Kahn's algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm)

## Hints
<details><summary>Hint 1</summary>

Start with Course Schedule. The order in which you "take" courses there is already the answer.
</details>
<details><summary>Hint 2</summary>

How do you know, at the end, whether every course made it into the order?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Kahn's: build the adjacency list `b → a` and the in-degrees. Queue the in-degree-0 courses,
pop them into `order` and decrement their neighbours. Return `order` if `len(order) ==
numCourses`, else `[]`.

Expected complexity: time O(V + E), space O(V + E).

</details>

## Follow-ups
- Return the lexicographically smallest valid order (min-heap instead of a queue).
- Return the order grouped by semester.
- Count all valid orders (exponential in general, so use bitmask DP for small n).
