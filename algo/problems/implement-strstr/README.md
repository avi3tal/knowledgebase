# Implement strStr()

> Difficulty: **easy** · Patterns: two-pointers, string-matching · Sources: [leetcode](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/), [interviewbit](https://www.interviewbit.com/problems/implement-strstr/)

## Problem
Given two strings `haystack` and `needle`, return the index of the **first** occurrence of
`needle` in `haystack`. Return `-1` if it doesn't occur. An **empty needle** matches at index `0`.
This is the convention of C's `strstr`, Python's `str.find` and the original LeetCode statement.

## Examples
- `haystack = "hello", needle = "ll"` → `2`.
- `haystack = "aaaaa", needle = "bba"` → `-1`.
- `haystack = "a", needle = ""` → `0`.

## Constraints
- `0 <= len(haystack), len(needle) <= 10^4`, lowercase English letters.
- Don't call the built-in `find` / `index` / `strings.Index`.
- Brute force is O(n · m). KMP or Z-function does it in **O(n + m)** time with O(m) space.

## Pattern & how to recognise it
- **"Find a pattern in a text"** → **string matching**. Start with the sliding comparison:
  for each start `i`, compare `needle` with `haystack[i:i+m]`. Then ask how to avoid re-comparing
  characters after a partial match.
- **Worst case for brute force:** `haystack = "aaaa…a"`, `needle = "aa…ab"`. Every start position
  matches `m - 1` characters before it fails.
- **Return the *first* match:** scan the start positions left to right, and stop at `n - m`
  (inclusive).

## Learning material
- **Brute force:** `for i in range(n - m + 1)`, compare up to `m` characters, and break on the
  first mismatch. O(n · m) worst case, O(1) space (slicing in Python copies, so it costs O(m)
  per check).
- **KMP:** precompute `lps[k]`, the length of the longest proper prefix of `needle[:k+1]` that is
  also a suffix of it. On a mismatch after `k` matched characters, jump to `k = lps[k-1]`
  instead of restarting. The text pointer never moves back, so the search is O(n + m).
- **Rabin–Karp:** a rolling hash of the window gives O(n + m) expected time. Verify on a hash hit.
- References: https://cp-algorithms.com/string/prefix-function.html,
  https://www.geeksforgeeks.org/kmp-algorithm-for-pattern-searching/

## Hints
<details><summary>Hint 1</summary>

What are the only start positions where `needle` could fit? Handle `m > n` and `m == 0` first.
</details>
<details><summary>Hint 2</summary>

After matching `k` characters and then failing, which part of what you matched could still be
the start of a match?
</details>
<details><summary>Hint 3</summary>

That question is answered once, for the needle alone: the prefix-function (`lps`) table.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

If `m == 0`, return 0. Build `lps` for `needle` in O(m). Scan `haystack` with `k` = the number
of matched characters. On a mismatch, while `k > 0`, set `k = lps[k-1]`. On a match, `k += 1`.
When `k == m`, return `i - m + 1`. Return -1 at the end. Time O(n + m), space O(m).
(Brute force is O(n · m) time and O(1) space, which is acceptable for small inputs.)
</details>

## Follow-ups
- Return **all** occurrences, including overlapping ones.
- Repeated Substring Pattern (LeetCode 459): solve it with the `lps` table.
- Shortest Palindrome (LeetCode 214): KMP on `s + "#" + reverse(s)`.
- Rabin–Karp for multiple patterns, and Aho–Corasick.
