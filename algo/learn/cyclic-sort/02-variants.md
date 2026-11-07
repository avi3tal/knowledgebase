## Variant 1: values outside the range, so skip them

"Find the missing number in `0..n`" has `n` slots for `n + 1` possible values. Value `n` has no
home. "First missing positive" can contain zeros, negatives and huge numbers. The fix is the
same: **only swap values that have a home**, and step over the rest.

```python
i = 0
while i < len(nums):
    j = nums[i] - 1
    if 0 <= j < len(nums) and nums[i] != nums[j]:   # in range and not already home
        nums[i], nums[j] = nums[j], nums[i]
    else:
        i += 1                                      # out of range or duplicate: leave it
```

The out-of-range values end up in the slots of the values that are **missing**. That's exactly
where the scan looks.

## Variant 2: the scan decides the question

After the placement pass, one O(n) scan answers the different questions:

| question | scan |
|---|---|
| the one missing number | first `k` with `nums[k] != k + 1` → `k + 1` |
| all missing numbers | every such `k` → `k + 1` |
| all duplicates | every such `k` → `nums[k]` (an extra copy parked in a foreign slot) |
| duplicate **and** missing | first such `k` → `[nums[k], k + 1]` |
| smallest missing positive | first such `k` → `k + 1`, or `n + 1` if all are home |
| first k missing positives | walk the mismatches, then continue past `n`, skipping values you saw |

## Variant 3: marking instead of swapping

When you need the original order back, or the problem asks you to "flag" values, use the **sign
of `nums[v − 1]`** as a visited bit. For each `v = abs(nums[i])`, negate `nums[v − 1]`. If it's
already negative, `v` was seen before. It's the same "value → home index" idea, with no swaps
and still O(1) extra space. Restore the signs afterwards if needed.

## A cousin: read-only arrays

If you **may not modify** the array and still need O(1) space (find the one duplicate in `n + 1`
values of `1..n`), neither swaps nor sign marks are allowed. Treat `i → nums[i]` as a linked
list and use Floyd's cycle detection instead. That's the Fast & Slow Pointers pattern
(practice: [Find the Duplicate Number](../../problems/find-the-duplicate-number/README.md)).

Below, `[3, 1, 2, 5, 2]` should be `1..5`, but the 4 was overwritten with a second 2. The
placement pass parks the extra 2 in the 4's slot, and the scan then reads off both answers
at once.
