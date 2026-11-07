# Number of Provinces

> Difficulty: **medium** · Patterns: union-find, dfs · Sources: [leetcode](https://leetcode.com/problems/number-of-provinces/)

## Problem
There are `n` cities. `isConnected` is an `n × n` matrix where `isConnected[i][j] == 1` means
cities `i` and `j` are directly linked (the matrix is symmetric and `isConnected[i][i] == 1`).
Links are transitive: if `a` is linked to `b` and `b` to `c`, all three are in the same
**province**. Return the number of provinces.

## Examples
- `isConnected = [[1,1,0],[1,1,0],[0,0,1]]` → `2`: {0, 1} and {2}.
- `isConnected = [[1,0,0],[0,1,0],[0,0,1]]` → `3`: no links at all.
- `isConnected = [[1,0,0,1],[0,1,1,0],[0,1,1,1],[1,0,1,1]]` → `1`: 0–3, 3–2, 2–1 chain everything.

## Constraints
- `1 <= n <= 200`, entries are 0 or 1, symmetric, ones on the diagonal.
- Reading the matrix is already O(n²); aim for O(n² · α(n)).

## Pattern & how to recognise it
- "How many **groups** when links are transitive" = the number of **connected components**.
- Two classic tools: a DFS/BFS from every unvisited city, or **union-find**: start with n
  singleton sets and merge the two sets of every link. The answer is the number of sets left.
- Union-find shines when links arrive one by one. Practise it here on the static version.
- Lesson: [Union-Find](../../learn/union-find/01-intro.md).

## Learning material
- **Disjoint set union (DSU):** `parent[i]` points towards the set's representative (root).
  `find(x)` follows parents to the root; `union(a, b)` links one root under the other.
- **Path compression** (point nodes straight at the root during `find`) plus **union by
  rank/size** makes each operation almost O(1): amortised O(α(n)), the inverse Ackermann function.
- Keep a `components` counter: start at n and decrement on every union that merges two
  different roots.
- [Disjoint-set data structure (Wikipedia)](https://en.wikipedia.org/wiki/Disjoint-set_data_structure)

## Hints
<details><summary>Hint 1</summary>

Every city starts as its own province. What does one `1` in the matrix do to the count?
</details>
<details><summary>Hint 2</summary>

A link between two cities that are already in the same province must not change the count. How
do you detect that quickly?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Union-find over n cities with `components = n`. For every `i < j` with `isConnected[i][j] == 1`,
find both roots; if they differ, link them and decrement `components`. Return `components`.
Alternative: count how many times you start a DFS from an unvisited city.

Expected complexity: time O(n² · α(n)), space O(n).

</details>

## Follow-ups
- Links arrive as a stream; report the count after each one.
- Return the size of the largest province.
- The input is an edge list instead of a matrix: what changes in the complexity?
