# Minimum Window Substring

> Difficulty: **hard** · Patterns: sliding-window · Sources: [leetcode](https://leetcode.com/problems/minimum-window-substring/)

## Problem
Given strings `s` and `t`, return the **shortest substring of `s`** that contains every
character of `t`, including duplicates. If there is none, return `""`. The answer is unique.

## Examples
- `s = "ADOBECODEBANC", t = "ABC"` → `"BANC"`
- `s = "a", t = "a"` → `"a"`
- `s = "a", t = "aa"` → `""` (`t` needs two a's)

## Constraints
- `1 <= len(s), len(t) <= 10^5`. Upper- and lowercase letters, case-sensitive.
- Target O(len(s) + len(t)).

## Pattern & how to recognise it
- "**Shortest contiguous** window that **covers** a requirement" → **dynamic sliding window**:
  grow until it covers `t`, then shrink while it *still* covers it, recording inside the
  shrink loop.
- Lesson: [Sliding Window](../../learn/sliding-window/02-dynamic.md).

## Learning material
- `need = Counter(t)` plus a window `have` map.
- Instead of comparing maps every step (O(alphabet)), track `formed`: the number of distinct
  characters whose window count has reached the required count. The window is valid when
  `formed == len(need)`.
- Update `formed` only when a count *crosses* the threshold, upward when growing and downward
  when shrinking.

## Hints
<details><summary>Hint 1</summary>

First find *any* window that contains t. Then ask which characters on its left are unnecessary.
</details>
<details><summary>Hint 2</summary>

Keep a single counter of how many required characters are fully satisfied, so the validity
check is O(1).
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Grow `end`. When `s[end]` is in `need` and `have[c]` reaches `need[c]`, increment `formed`.
While `formed == len(need)`: record the window if it's shorter, then remove `s[start]`. If that
drops a count below `need`, decrement `formed`. Move `start` right.
Time O(m + n), space O(alphabet).
</details>

## Follow-ups
- Find All Anagrams in a String (LeetCode 438): a fixed window of size len(p) with the same
  counting trick.
- Permutation in String (LeetCode 567).
