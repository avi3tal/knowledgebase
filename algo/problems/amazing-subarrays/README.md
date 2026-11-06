# Amazing Subarrays

> Difficulty: **easy** · Patterns: math · Sources: [interviewbit](https://www.interviewbit.com/problems/amazing-subarrays/)

## Problem
A substring of `s` is **amazing** if it starts with a vowel (`a e i o u`, either case). Return
the number of amazing substrings of `s`, **modulo 10003**. Substrings at different positions
count separately, even when they are equal as text.

## Examples
- `"ABEC"` → `6`. The amazing substrings are `A, AB, ABE, ABEC, E, EC`.
- `"bcdfg"` → `0`.
- `"aeiou"` → `15`. Every one of the 15 substrings starts with a vowel.

## Constraints
- `1 <= len(s) <= 10^6`. `s` may contain any characters, including special ones.
- There are O(n^2) substrings, so enumerating them is too slow. Target **O(n)** time, O(1)
  space.

## Pattern & how to recognise it
- **"Count substrings with a property of their start (or end)"** → **counting by
  contribution**. Each start index `i` begins exactly `n - i` substrings. So you don't
  enumerate substrings; you add `n - i` for every qualifying `i`.
- **"Return the answer mod M"** → the count can be huge (up to about n^2/2). Reduce modulo `M`
  as you go. In Python it doesn't matter; in Go/C it prevents overflow for large `n`.

## Learning material
- **Contribution technique:** instead of iterating over all objects (substrings), iterate over
  one feature (the start index) and count how many objects it belongs to. Many "sum over all
  subarrays" problems become O(n) this way, e.g. the sum of all subarray sums, where element `i`
  contributes `a[i] · (i+1) · (n-i)`.
- **Modular arithmetic:** `(a + b) mod M = ((a mod M) + (b mod M)) mod M`, so reducing at every
  step gives the same result as reducing once at the end.
- Use a set (or a string like `"aeiouAEIOU"`) for the vowel check, which is O(1) per character.

## Hints
<details><summary>Hint 1</summary>

Fix the start index `i`. How many substrings start at `i`?
</details>
<details><summary>Hint 2</summary>

Only start indices with a vowel count, so sum their contributions.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`total = 0`. For each `i` with `s[i]` a vowel, `total = (total + n - i) % 10003`. Return
`total`. Time O(n), space O(1).
</details>

## Follow-ups
- Count substrings that start **and** end with a vowel. You need the number of vowels to the
  right of each index (a suffix count).
- The sum of all subarray sums (the contribution of each element).
- Count Vowel Substrings (LeetCode 2062): substrings made only of vowels that contain all five.
