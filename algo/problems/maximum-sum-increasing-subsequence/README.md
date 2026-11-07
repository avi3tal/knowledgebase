# Maximum Sum Increasing Subsequence

> Difficulty: **medium** · Patterns: longest-common-substring, dp-1d · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/maximum-sum-increasing-subsequence-dp-14/)

## Problem
Given an array of positive integers `nums`, return the **largest sum** of a **strictly
increasing subsequence** (keep the order, skip any elements, each kept element strictly larger
than the previous one).

## Examples
- `nums = [1, 101, 2, 3, 100, 4, 5]` → `106`: `[1, 2, 3, 100]`.
- `nums = [1, 2, 3, 100, 4, 5, 6]` → `106`: `[1, 2, 3, 100]` beats the longer `[1, 2, 3, 4, 5, 6]` (sum 21).
- `nums = [10, 8, 6, 4]` → `10`: a single element.

## Constraints
- `1 <= len(nums) <= 2000`, `1 <= nums[i] <= 10^4`.
- O(n²) is the target.

## Pattern & how to recognise it
- "Increasing **subsequence**" with something to optimise about it → one sequence against
  itself. This is the **Longest Common Substring** pattern (the DesignGurus PDF uses this exact
  problem as its sample).
- It's the sibling of Longest Increasing Subsequence, but it optimises the **sum** instead of
  the length, so the longest subsequence is not necessarily the answer.
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/02-variants.md).

## Learning material
- **"Ending here" states:** let a cell describe the best subsequence that ends *exactly* at
  index `i`. Each cell looks back at every earlier index that may precede it. That's O(n) per
  cell and O(n²) in total.
- The final answer is the best cell **anywhere**, not the last one.
- [GeeksforGeeks: Maximum Sum Increasing Subsequence](https://www.geeksforgeeks.org/maximum-sum-increasing-subsequence-dp-14/)

## Hints
<details><summary>Hint 1</summary>

Suppose the best subsequence ends at `nums[i]`. What must be true of the element right before
it?
</details>
<details><summary>Hint 2</summary>

Start each cell at `nums[i]` on its own, then try to extend the best cell of every earlier,
smaller element.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`best[i] = nums[i] + max(best[j] for j < i if nums[j] < nums[i])` (or `nums[i]` if there is no
such `j`). The answer is `max(best)`.

Expected complexity: time O(n²), space O(n).

</details>

## Follow-ups
- Return the subsequence itself (store the predecessor index of each cell).
- Allow negative numbers. What changes about the base case?
- An O(n log n) version with a Fenwick tree or segment tree keyed by value (prefix max).
