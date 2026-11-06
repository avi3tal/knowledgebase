# Count and Say

> Difficulty: **medium** · Patterns: simulation · Sources: [leetcode](https://leetcode.com/problems/count-and-say/), [interviewbit](https://www.interviewbit.com/problems/count-and-say/)

## Problem
The count-and-say sequence starts at `"1"`. Each next term is the previous term **read aloud**:
group consecutive equal digits, and for each group write its length followed by the digit.
Given `n` (1-indexed), return the `n`-th term as a string.

## Examples
- `n = 1` → `"1"`.
- `n = 2` → `"11"` ("one 1").
- `n = 4` → `"1211"`, because `"21"` is read as "one 2, one 1".

## Constraints
- `1 <= n <= 30`.
- Term lengths grow by about 1.30 per step (Conway's constant). The output for `n` is
  O(1.3^n) long, so building every term once is optimal.

## Pattern & how to recognise it
- **"Generate the next term from the previous one"** → **simulation** with a loop that runs
  `n - 1` times. No clever formula exists.
- Each step is a **run-length encoding** pass: one scan that tracks the current character and
  its count.
- Watch the **indexing**. Term 1 is the seed, so you apply the step `n - 1` times.

## Learning material
- **Run-length encoding:** walk the string with `i`. Let `j` advance while `s[j] == s[i]`. Emit
  `str(j - i) + s[i]`, then set `i = j`. That's O(len) per term.
- **String building:** collect the pieces in a list and `"".join` them (Python), or use
  `strings.Builder` (Go). Repeated `+=` can turn a linear pass quadratic.
- `itertools.groupby` in Python does the grouping for you. Know how to do it by hand too.
- Reference: https://en.wikipedia.org/wiki/Look-and-say_sequence

## Hints
<details><summary>Hint 1</summary>

Write a helper `next(term)` that reads one term aloud. Then call it the right number of times.
</details>
<details><summary>Hint 2</summary>

If term 1 is `"1"`, how many times do you call `next` to get term `n`?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Start with `s = "1"`. Repeat `n - 1` times: run-length encode `s` into a list of `count + digit`
pieces, then join. Return `s`. Time O(total length of all terms) = O(1.3^n), space O(1.3^n).
</details>

## Follow-ups
- Prove that no digit greater than 3 ever appears (starting from `"1"`).
- String Compression (LeetCode 443): run-length encode an array in place.
- Decode a run-length encoded string (Decode String, LeetCode 394, is the nested version).
