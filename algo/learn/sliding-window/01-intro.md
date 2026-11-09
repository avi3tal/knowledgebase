# Sliding Window

> Pattern #1 · Data structures: array, string, hash map

Many problems ask for something about every **contiguous** subarray or substring: the max sum
of k consecutive numbers, the longest substring without repeats, the shortest subarray whose
sum reaches a target. Brute force restarts from scratch at every position, which is O(n·k) or
O(n²).

**The insight:** two neighbouring windows share almost everything. Moving the window one step
right adds one element on the right and removes one on the left. Keep a running summary of the
window (a sum, counts in a hash map, a set) and **update it in O(1)** instead of recomputing it.

```figure
fixed-window-sum
```

Each element enters the window once and leaves at most once, so the whole scan is **O(n)**.

## Fixed-size window: the template

```python
window_start, state = 0, <empty>
for window_end in range(len(nums)):
    <add nums[window_end] to state>
    if window_end - window_start + 1 == k:      # window is full
        <use state>                              # record answer
        <remove nums[window_start] from state>  # slide
        window_start += 1
```

Step through it below. Watch `window_start` / `window_end` and how `window_sum` changes by
exactly one add and one subtract per step.
