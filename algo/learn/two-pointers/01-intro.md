# Two Pointers

> Pattern #3 · Data structures: array, string, linked list

Many array problems ask about **pairs**: two numbers that add up to a target, the two walls that
hold the most water, whether the first and last characters of a string match. Brute force tries
every pair with two nested loops, which is O(n²).

**The insight:** when the input is **sorted** (or symmetric, like a palindrome), one comparison
tells you which of the two candidates can't be part of the answer. Put one pointer at each end,
look at the pair, and **move the pointer whose element can't improve the answer**. Each step
throws away a whole row of pairs, not just one.

```figure
squares-from-both-ends
```

The pointers only ever move towards each other, and every step moves one of them, so the loop
runs at most n times: **O(n)** time and O(1) extra space (beyond the output).

## Opposite ends: the template

```python
left, right = 0, len(nums) - 1
while left < right:            # or <= when the middle element also counts
    <look at nums[left], nums[right]>
    if <pair is the answer>:
        <record it>            # then move one or both pointers
    elif <left side is too small / can't win>:
        left += 1
    else:
        right -= 1
```

## Why throwing a candidate away is safe

Take *pair with target sum* on a sorted array. If `nums[left] + nums[right] < target`, then
`nums[left]` plus **any** element at or left of `right` is also too small, because they are all
`≤ nums[right]`. So `nums[left]` can't be in any remaining pair. Drop it: `left += 1`. The
mirror argument drops `nums[right]` when the sum is too big.

Every opposite-ends problem has the same shape of proof. Name the pointer whose element is
**dominated**: no pair it can still form beats one you've already seen (or could still see). In
*container with most water* that's the shorter wall. Any narrower container using it is no
taller, so it can only hold less. If you can't write that one sentence, the pattern probably
doesn't apply.

In the example below, the input is sorted but may contain negatives, so the **largest square is
at one of the two ends**. Compare the two ends, write the bigger square into the **back** of
`result`, and move that pointer inward. Watch `fill` walk from right to left.
