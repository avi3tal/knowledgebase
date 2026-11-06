# Roman to Integer

> Difficulty: **easy** · Patterns: math, hashmap · Sources: [leetcode](https://leetcode.com/problems/roman-to-integer/)

## Problem
Convert a valid Roman numeral `s` to an integer. Symbols: `I=1, V=5, X=10, L=50, C=100, D=500,
M=1000`. Normally symbols are written largest to smallest and added; a smaller symbol placed
**before** a larger one is subtracted (`IV = 4`, `IX = 9`, `XL = 40`, `XC = 90`, `CD = 400`,
`CM = 900`).

## Examples
- `s = "III"` → `3`
- `s = "LVIII"` → `58` (L + V + III)
- `s = "MCMXCIV"` → `1994` (M + CM + XC + IV)

## Constraints
- `1 <= len(s) <= 15`, `s` is a valid numeral in `[1, 3999]`.

## Pattern & how to recognise it
- **Symbol → value lookup** (hashmap or switch) plus a **one-character lookahead**: if the current
  value is smaller than the next one, subtract it, otherwise add it.
- Equivalently scan right to left, subtracting any value smaller than the previous one seen.

## Learning material
- Lookahead rule: `total += v[i] if v[i] >= v[i+1] else -v[i]`. This handles all six
  subtractive pairs without listing them.
- An alternative is consuming two characters on a subtractive pair (`next - current`, skip 2) —
  equivalent for valid input.
- Integer to Roman (the inverse) is a greedy problem over the 13 values `1000, 900, 500, 400, …`.
- LeetCode editorial: https://leetcode.com/problems/roman-to-integer/editorial/

## Hints
<details><summary>Hint 1</summary>

When is a symbol's value subtracted rather than added?
</details>
<details><summary>Hint 2</summary>

Compare each symbol with the one right after it.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For each `i`: if `i + 1 < n` and `v[s[i]] < v[s[i+1]]` subtract, else add.
Time O(n), space O(1).
</details>

## Follow-ups
- Integer to Roman (LeetCode 12, greedy).
- Validate that a string is a well-formed Roman numeral (e.g. reject `IIII`, `IC`, `VX`).
