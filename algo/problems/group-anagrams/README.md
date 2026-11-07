# Group Anagrams

> Difficulty: **medium** · Patterns: strings, hashmap · Sources: [leetcode](https://leetcode.com/problems/group-anagrams/)

## Problem
Given a list of strings `strs`, group together the strings that are **anagrams** of each other
(same letters with the same counts, in any order). Return the groups in any order, and the
strings inside a group in any order.

## Examples
- `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]` →
  `[["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]`.
- `strs = [""]` → `[[""]]`.
- `strs = ["a"]` → `[["a"]]`.

## Constraints
- `0 <= strs.length <= 10^4`, `0 <= strs[i].length <= 100`, lowercase letters.
- Comparing every pair of strings is O(n² · L). Aim for O(n · L log L) or O(n · L).

## Pattern & how to recognise it
- "Group things that are equal **up to rearrangement**" → compute a **canonical key** per string
  that is identical for all anagrams, then bucket by key in a hash map.
- Two standard keys: the **sorted** string (O(L log L)) or the tuple of **26 letter counts**
  (O(L)).
- Lesson: [Strings](../../learn/strings/01-intro.md).

## Learning material
- **Canonical form / signature:** a function f with f(a) == f(b) exactly when a and b are
  "the same" under your equivalence. Bucket by f in a dict.
- In Python, lists can't be dict keys. Use `tuple(counts)` or `"".join(sorted(s))`. In Go, a
  `[26]int` array is a valid map key.
- [Anagram (Wikipedia)](https://en.wikipedia.org/wiki/Anagram)

## Hints
<details><summary>Hint 1</summary>

What value could you compute from `"eat"`, `"tea"` and `"ate"` that comes out identical for all
three, but different for `"tan"`?
</details>
<details><summary>Hint 2</summary>

Can you build that key in O(L) instead of sorting? The alphabet has only 26 letters.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`groups = defaultdict(list)`; for each `s`, `key = tuple of 26 letter counts` (or
`"".join(sorted(s))`); `groups[key].append(s)`. Return `list(groups.values())`.

Expected complexity: time O(n · L) with count keys (O(n · L log L) with sorted keys), space O(n · L).

</details>

## Follow-ups
- Unicode strings: the counts key becomes a dict / sorted tuple of (char, count) pairs.
- Find all start indices of anagrams of `p` inside `s` (sliding window with counts).
- Group strings that are equal under **shifting** (abc ~ bcd): key by the differences.
