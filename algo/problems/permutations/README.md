# Permutations

> Difficulty: **medium** · Patterns: backtracking, recursion · Sources: [leetcode](https://leetcode.com/problems/permutations/), [interviewbit](https://www.interviewbit.com/problems/permutations/)

## Problem
Given a list `nums` of **distinct** integers, return all of its permutations. The permutations may
be listed in any order, but each one is an ordered list.

## Examples
- `[1,2,3]` → `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`
- `[0,1]` → `[[0,1],[1,0]]`
- `[1]` → `[[1]]`

## Constraints
- `1 <= len(nums) <= 6`, `-10 <= nums[i] <= 10`, all distinct.
- There are n! permutations of length n, so **O(n · n!)** is optimal. Avoid extra work per leaf.

## Pattern & how to recognise it
- **"Return all arrangements"** → **backtracking**: choose an element for the next position, recurse
  on the rest, undo the choice.
- The recursion tree has n choices at depth 0, then n-1, and so on, giving n! leaves at depth n.
- See [algo/notes/patterns.md](../../notes/patterns.md).

## Learning material
- **Template:** `backtrack(path, used)`: if `len(path) == n`, record a copy. Otherwise, for each
  unused element, mark it, append it, recurse, then pop it and unmark it.
- **Swap-in-place variant:** for position `l`, swap each `i >= l` into `l`, recurse on `l+1`, then
  swap back. No `used` array is needed.
- **Slicing variant** (`rest = nums[:i] + nums[i+1:]`, prepend `nums[i]` to every permutation of `rest`)
  is the most readable, but it copies O(n) lists at every node. Its asymptotic cost is still O(n · n!).
- Record a **copy** of `path` (`path[:]`), not the list you keep mutating.

## Hints
<details><summary>Hint 1</summary>

Pick the first element in n ways. For each choice, the rest is the same problem on n-1 elements.
</details>
<details><summary>Hint 2</summary>

Keep one `path` list and a `used` set. Append before recursing and pop after.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Backtracking with `path` + `used[]`: at each depth try every unused index, recurse, and undo.
When `len(path) == n`, append `path[:]` to the result. Time O(n · n!), space O(n) recursion
(plus the output).
</details>

## Follow-ups
- Input with duplicates → unique permutations only (Permutations II, LeetCode 47): sort and skip
  equal siblings.
- Next lexicographic permutation in place (LeetCode 31). k-th permutation (LeetCode 60).
- The string version: [Permutations of a String](../permutations-of-string/README.md).
