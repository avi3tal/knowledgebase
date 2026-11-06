# Largest Number

> Difficulty: **medium** · Patterns: sorting, greedy · Sources: [interviewbit](https://www.interviewbit.com/problems/largest-number/), [leetcode](https://leetcode.com/problems/largest-number/)

## Problem
Given a list of non-negative integers `nums`, arrange them so that their concatenation forms the
largest possible number, and return it as a **string** (it may not fit in any integer type).

## Examples
- `nums = [3, 30, 34, 5, 9]` → `"9534330"`
- `nums = [8, 89]` → `"898"` (`"898" > "889"`)
- `nums = [0, 0]` → `"0"` (not `"00"`)

## Constraints
- `1 <= len(nums) <= 100` (LeetCode) / up to 10^5 elsewhere, `0 <= nums[i] <= 10^9`
- Sorting-based: O(n log n) comparisons, each comparing O(d)-digit strings.

## Pattern & how to recognise it
- "Arrange elements to optimise a concatenation" → **sort with a custom comparator**.
  The greedy choice: `a` goes before `b` iff `a + b > b + a` as strings.
- Plain lexicographic sort fails (`"30" > "3"` but `"330" > "303"`), and numeric sort fails too.

## Learning material
- **Custom comparators:** Python `sorted(..., key=functools.cmp_to_key(cmp))`; Go
  `slices.SortFunc` / `sort.Slice`. The comparator must be a strict weak ordering; the
  concatenation order is transitive, which is why the greedy sort is correct (proof sketch in the
  LeetCode editorial).
- Edge case: if the largest element is `0`, the answer is `"0"`.
- Merge sort is a fine hand-written choice: stable, O(n log n) comparisons.
- LeetCode editorial: https://leetcode.com/problems/largest-number/editorial/

## Hints
<details><summary>Hint 1</summary>

For just two numbers `a` and `b`, how do you decide which goes first?
</details>
<details><summary>Hint 2</summary>

Turn that pairwise decision into a sort comparator. Then deal with all-zero input.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Convert to strings, sort with comparator `a + b > b + a → a first`, join. If the result starts
with `'0'`, return `"0"`. Time O(n log n · d), space O(n · d).
</details>

## Follow-ups
- Smallest number instead (flip the comparator; watch leading zeros).
- Prove the comparator is transitive.
