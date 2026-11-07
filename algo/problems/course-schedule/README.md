# Course Schedule

> Difficulty: **medium** · Patterns: topological-sort · Sources: [leetcode](https://leetcode.com/problems/course-schedule/)

## Problem
There are `numCourses` courses labelled `0 … numCourses - 1`. `prerequisites[i] = [a, b]`
means you must take course `b` **before** course `a`. Return `true` if it is possible to finish
every course, otherwise `false`.

## Examples
- `numCourses = 2, prerequisites = [[1, 0]]` → `true`: take 0, then 1.
- `numCourses = 2, prerequisites = [[1, 0], [0, 1]]` → `false`: each course waits for the other.
- `numCourses = 3, prerequisites = [[1, 1]]` → `false`: a course can't be its own prerequisite.

## Constraints
- `1 <= numCourses <= 2000`, `0 <= len(prerequisites) <= 5000`.
- `0 <= a, b < numCourses`. Pairs may repeat.
- The target is linear in courses plus prerequisites: O(V + E).

## Pattern & how to recognise it
- "Prerequisites", "must take b before a" → directed dependency edges → **Topological Sort**.
- "Is it possible?" is the same question as "does the dependency graph have no cycle?".
- Trying every ordering of the courses is n!.
- Lesson: [Topological Sort](../../learn/topological-sort/01-intro.md).

## Learning material
- **In-degree:** the number of edges pointing into a node, here the number of prerequisites
  still pending. A node with in-degree 0 can be taken right away.
- **Kahn's algorithm:** repeatedly remove an in-degree-0 node and decrement its neighbours.
  Every node is removed exactly when the graph is acyclic. O(V + E).
- [Topological sorting (Wikipedia)](https://en.wikipedia.org/wiki/Topological_sorting)

## Hints
<details><summary>Hint 1</summary>

Which courses can you take on day one? What changes once you've taken one of them?
</details>
<details><summary>Hint 2</summary>

Keep a count of pending prerequisites per course. What does it mean if you get stuck with
courses left whose count never reaches 0?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Build `graph[b].append(a)` and `in_degree[a] += 1` for every `[a, b]`. Queue all courses with
in-degree 0. Pop, count it, decrement each neighbour and enqueue the ones that reach 0. Return
`taken == numCourses`. (DFS with three colours, unvisited / active / done, works too. Find an
edge into an active node and you've found a cycle.)

Expected complexity: time O(V + E), space O(V + E).

</details>

## Follow-ups
- Return one valid order (Course Schedule II).
- Minimum number of semesters if you may take any number of courses at once (Parallel Courses).
- Detect the cycle and return the courses on it.
