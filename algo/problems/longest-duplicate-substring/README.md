# Longest Duplicate Substring

> Difficulty: **hard** · Patterns: longest-common-substring, binary-search, string-matching · Sources: [leetcode](https://leetcode.com/problems/longest-duplicate-substring/)

## Problem
Given a string `s`, return a longest substring that occurs **at least twice** in `s`. Occurrences may
overlap. If several have the maximum length, return any of them. If none repeats, return `""`.

## Examples
- `s = "banana"` → `"ana"` (at indices 1 and 3, overlapping).
- `s = "abcd"` → `""`.
- `s = "abcabxyzxy"` → `"ab"` or `"xy"` (both length 2; either is accepted).

## Constraints
- `1 <= len(s) <= 3·10^4`, lowercase letters.
- The O(n^2) DP of [Longest Repeating Substring](../longest-repeating-substring/README.md) is about
  10^9 steps here, which is too slow. The target is O(n log n).

## Pattern & how to recognise it
- It is the same question as [Longest Repeating Substring](../longest-repeating-substring/README.md)
  (Longest Common Substring of `s` with itself), but with **constraints too large for the 2-D table**.
- **Monotonic answer → binary search on the length.** If some length-`L` substring repeats, a
  length-`L-1` one does too. So find the largest `L` for which "a repeat of length `L` exists" is true.
- Each check needs all windows of length `L` in O(n): a **rolling hash** (Rabin-Karp) slides one
  character at a time.
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/02-variants.md).

## Learning material
- **Rabin-Karp rolling hash.** Treat a window as a number in base `B` modulo a large prime `M`:
  `h = (s[i]·B^(L-1) + … + s[i+L-1]) mod M`. To slide the window, remove the leading term, multiply
  by `B` and add the new character. That is O(1) per step, so all windows of one length cost O(n).
- **Collisions:** equal hashes don't prove equal strings. Compare the substrings on a hash hit, or use
  two moduli (double hashing) so a false match is practically impossible.
- **Binary search** over `L` in `[1, n-1]` runs about log n checks of O(n) each: O(n log n) in total.
- **Linear alternatives:** a suffix array with an LCP array (the answer is the maximum LCP of
  adjacent suffixes), or a suffix automaton.
- Reading: [cp-algorithms: string hashing](https://cp-algorithms.com/string/string-hashing.html),
  [cp-algorithms: suffix array](https://cp-algorithms.com/string/suffix-array.html).

## Hints
<details><summary>Hint 1</summary>

If you knew the answer's length `L`, how would you find a repeated window of that length quickly?
</details>
<details><summary>Hint 2</summary>

The predicate "some length-`L` substring repeats" is monotonic in `L`. What search does that allow?
</details>
<details><summary>Hint 3</summary>

Hash every window of length `L` in O(n) total by rolling the hash, and remember where each hash was
first seen.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Binary search `L` with `lo = 1`, `hi = n - 1`. `check(L)` rolls a polynomial hash over every window
of length `L`, keeping a dict from hash to start index(es). On a repeated hash it verifies the
substrings are actually equal (or uses a double hash) and returns that start. If `check(mid)` finds
a start, record `s[start:start+mid]` and search higher; otherwise search lower.

Expected complexity: time O(n log n), space O(n).
</details>

## Follow-ups
- Return every distinct longest duplicate.
- The longest substring that repeats at least `k` times.
- Longest common substring of **two** long strings: the same binary search, checking whether one
  string's window hashes appear in the other's.
