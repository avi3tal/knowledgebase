# Top K Frequent Elements

> Difficulty: **medium** · Patterns: top-k-elements, hashmap · Sources: [leetcode](https://leetcode.com/problems/top-k-frequent-elements/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
Given an integer array `nums` and an integer `k`, return the `k` most frequent elements, in
**any order**. The answer is guaranteed to be unique.

## Examples
- `nums = [1,1,1,2,2,3], k = 2` → `[1,2]`.
- `nums = [1], k = 1` → `[1]`.

## Constraints
- `1 <= len(nums) <= 10^5`, `-10^4 <= nums[i] <= 10^4`.
- `k` is between 1 and the number of distinct values.
- Better than O(n log n) is expected: O(n log k) with a heap, or O(n) with buckets.

## Pattern & how to recognise it
- "The **k most** frequent" → count first (hash map), then **Top 'K' Elements** on the counts.
- For the k **largest** counts, keep a **min**-heap of `(count, value)` of size k: its top is the
  weakest of the kept values.
- Lesson: [Top 'K' Elements](../../learn/top-k-elements/01-intro.md) (Variant 1 in the variants).

## Learning material
- `collections.Counter` (or a `map[int]int` in Go) counts in O(n).
- The heap only sees the d **distinct** values, so the heap part is O(d log k).
- **Bucket sort** alternative: a count is at most n, so `buckets[c]` lists the values seen `c`
  times. Walk the buckets from n down until you have k values. O(n) time.

## Hints
<details><summary>Hint 1</summary>

First turn the array into "value → how many times". Now the question is about the k largest
numbers in that table.
</details>
<details><summary>Hint 2</summary>

A size-k min-heap of `(count, value)`: when it grows past k, pop the smallest count.
</details>
<details><summary>Hint 3</summary>

Could you skip the heap? A count can only be between 1 and n.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Count with a hash map. For each `(value, count)`, push `(count, value)` onto a min-heap and pop
whenever its size exceeds k. Return the values in the heap.

Time O(n + d log k), space O(n). The bucket version is O(n) time.
</details>

## Follow-ups
- Top k frequent **words**, sorted by frequency then alphabetically (LeetCode 692).
- A stream of values: keep counts and a heap, and handle counts changing (lazy updates).
- Sort characters by frequency (LeetCode 451): the same counting, but output every value.
