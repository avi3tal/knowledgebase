# Maximum Distinct Elements

> Difficulty: **medium** · Patterns: top-k-elements, greedy, hashmap · Sources: [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
Given an array of integers `nums` and an integer `k`, remove **exactly `k`** elements from the
array so that the number of **distinct** elements left is as large as possible. An element is
*distinct* if its value appears **exactly once** in what remains.

Return that maximum number of distinct elements.

## Examples
- `nums = [7,3,5,8,5,3,3], k = 2` → `3`. Remove one 5 and one 3: `[7,3,5,8,3]`. Now 7, 5 and
  8 appear once (3 still appears twice).
- `nums = [3,5,12,11,12], k = 3` → `2`. Remove one 12: 3, 5, 11, 12 are all distinct. Two more
  removals must each delete a distinct element, leaving 2.
- `nums = [1,2,3,3,3,3,4,4,5,5,5], k = 2` → `3`. Remove one 4 (now 4 is distinct) and one 5
  (5 still repeats, but that removal costs nothing). Distinct: 1, 2, 4.

## Constraints
- `1 <= len(nums) <= 10^5`, `0 <= k <= len(nums)`.
- Trying every set of k removals is exponential. Aim for O(n log n).

## Pattern & how to recognise it
- A **budget k** spent on the elements in order of **cheapest first**, where the cost comes from
  a **frequency** → count, then a **min-heap by count** (Top 'K' Elements family, Variant 3 in the
  lesson).
- The greedy works because every duplicated value is worth exactly 1 once fixed, so cheap fixes
  first maximise how many you can afford.
- Lesson: [Top 'K' Elements](../../learn/top-k-elements/01-intro.md).

## Learning material
- A value appearing `c` times needs `c − 1` removals to become distinct.
- Values that already appear once are free. Leftover budget can be dumped into any value that is
  still duplicated at no cost. Only when **every** value is distinct does each extra removal delete
  a distinct element.
- Sorting the counts works just as well as a heap here.

## Hints
<details><summary>Hint 1</summary>

Start by counting. Which values are already distinct, and what does it cost to make each of the
others distinct?
</details>
<details><summary>Hint 2</summary>

Fix the duplicated values with the **smallest** counts first. What happens if you still have
removals left after fixing all of them?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Count. `distinct` = number of values with count 1. Push the other counts into a min-heap. While
`k > 0` and the heap isn't empty: pop `c` and spend `k -= c − 1`. If `k >= 0`, the value is now
distinct: `distinct += 1`. (If `k` went negative, you couldn't afford it, but the removals you had
were absorbed by its spare copies, so nothing distinct was lost.) At the end, if `k > 0`, every
value is distinct and each extra removal deletes one: return `max(0, distinct − k)`. Otherwise
return `distinct`.

Time O(n log n), space O(n).
</details>

## Follow-ups
- Remove **at most** k elements instead of exactly k.
- Minimise the number of distinct **values** (not single occurrences) after removing k elements:
  remove the least frequent values entirely (LeetCode 1481).
