# Majority Element

> Difficulty: **easy** · Patterns: arrays-hashing · Sources: [leetcode](https://leetcode.com/problems/majority-element/), [algomaster](https://algomaster.io/practice/dsa/majority-element?list=am-300)
## Problem
Given an array `nums` of size `n`, return the **majority element**: the value that appears
**more than `⌊n/2⌋` times**. You may assume it always exists.

## Examples
- `[3,2,3]` → `3`.
- `[2,2,1,1,1,2,2]` → `2` (4 of 7).
- `[1]` → `1`.

## Constraints
- `1 <= n <= 5·10^4`, `-10^9 <= nums[i] <= 10^9`, a majority is guaranteed.
- Follow-up from the statement: O(n) time **and O(1) space**.

## Pattern & how to recognise it
- "Appears more than n/2 times" → **counting**. The first solution is a hash map of counts
  (`arrays-hashing`); the O(1)-space solution is the **Boyer-Moore voting algorithm**.
- Sorting works too (the majority must sit at index `n/2`), O(n log n).
- Lesson: [Arrays & Hashing](../../learn/arrays-hashing/01-intro.md) (watch the Boyer-Moore trace).
- Family: [majority-element-ii](../majority-element-ii/README.md) (> n/3, stretch),
  [max-consecutive-ones](../max-consecutive-ones/README.md) (another "one running counter" scan).

## Learning material
**Hash map, the simple way.** Ask "what do I need to know at each step?" Only: *has this value
crossed the threshold yet?* So:
- `count[v]++` (in Go the map's zero value is `0`, no existence check needed; in Python use
  `defaultdict(int)` or `Counter`),
- if `count[v] > n/2`, **return `v` immediately**.

You don't need a "best so far" struct or a `break` followed by more logic: the guarantee means
the first value to cross `n/2` *is* the answer. Rule of thumb: when the statement guarantees an
answer exists, return the moment you find it.

**Boyer-Moore voting, O(1) space.** Pair each majority vote against a different vote and cancel
them. Because the majority has more than half the votes, it can't be fully cancelled.
- Keep `candidate` and `count`.
- For each `x`: if `count == 0`, take `x` as the new candidate. Then `count += 1` if
  `x == candidate`, else `count -= 1`.

```
x:          2  2  1  1  1  2  2
candidate:  2  2  2  2  1  1  2     (switches when count hits 0)
count:      1  2  1  0  1  0  1
```

The final candidate is correct **only because a majority is guaranteed**. Without the guarantee
you need a second pass to count it (see majority-element-ii).

- Reading: [Boyer–Moore majority vote algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_majority_vote_algorithm).

## Hints
<details><summary>Hint 1</summary>

With a map: what is the earliest moment you can be sure of the answer?
</details>
<details><summary>Hint 2</summary>

For O(1) space: if you cancel each majority element against one non-majority element, what survives?
</details>
<details><summary>Hint 3</summary>

Keep one candidate and a counter. What should happen when the counter reaches zero?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Hash map: `count[x]++`; return `x` as soon as `count[x] > n/2`. O(n) time, O(n) space.

Boyer-Moore: `count = 0`; for each `x`: if `count == 0 { candidate = x }`; `count += (x == candidate) ? 1 : -1`.
Return `candidate`.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- No guarantee that a majority exists: add a verification pass.
- Elements appearing more than n/3 times: [majority-element-ii](../majority-element-ii/README.md).
- More than n/k times: k-1 candidates (Misra–Gries).
- Streaming data: Boyer-Moore is a one-pass, O(1) memory stream algorithm.
