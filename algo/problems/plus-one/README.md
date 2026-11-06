# Add One To Number

> Difficulty: **easy** · Patterns: arrays-hashing, math · Sources: [interviewbit](https://www.interviewbit.com/problems/add-one-to-number/), [leetcode](https://leetcode.com/problems/plus-one/)

## Problem
A non-negative integer is given as an array of decimal `digits`, most significant digit first.
Return the digits of the number plus one. The input **may contain leading zeros**
(InterviewBit variant); the result must not (`[0, 0, 4, 5]` → `[4, 6]`).

## Examples
- `digits = [1, 2, 3]` → `[1, 2, 4]`
- `digits = [9, 9, 9]` → `[1, 0, 0, 0]`
- `digits = [0, 0, 4, 5]` → `[4, 6]`

## Constraints
- `1 <= len(digits) <= 10^5`, `0 <= digits[i] <= 9`
- The number can be far larger than 64 bits, so converting to an int is not the intended route.
- O(n) time.

## Pattern & how to recognise it
- **Grade-school addition with carry**, walking from the least significant digit (the end)
  towards the front. You can stop as soon as there is no carry.
- The only time the length grows is when every digit is 9.

## Learning material
- Walk `i` from the last index to 0: if `digits[i] < 9`, increment it and you're done; otherwise
  set it to 0 and carry on. If the loop finishes, prepend a `1`.
- Leading zeros: skip them first (find the first non-zero index), or strip them from the result.
  An all-zero input is the number 0, whose successor is `[1]`.
- Recursion on slices (`plus_one(A[:-1]) + [0]`) is correct but copies the array at every level
  → O(n²) and O(n) stack depth.
- LeetCode editorial: https://leetcode.com/problems/plus-one/editorial/

## Hints
<details><summary>Hint 1</summary>

Where does addition start, and when can you stop early?
</details>
<details><summary>Hint 2</summary>

Handle the leading zeros separately; then think about what `[9, 9, 9]` must become.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Strip leading zeros (keep at least one digit). Iterate from the end: `< 9` → increment and return;
`== 9` → set to 0. If every digit was 9, return `[1] + digits`.
Time O(n), space O(1) extra (O(n) only when the result grows).
</details>

## Follow-ups
- Add two numbers given as digit arrays / linked lists (LeetCode 2, 445).
- Multiply a digit array by a single digit, or multiply two strings (LeetCode 43).
