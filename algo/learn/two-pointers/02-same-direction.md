## Same direction: read and write pointers

The second shape has both pointers starting at the **left** and moving the **same way**, at
different speeds. It's the standard way to **compact an array in place**: remove duplicates,
remove a value, move zeroes to the end.

- `read` scans every element, one step per iteration.
- `write` marks the end of the part you've decided to **keep**. Everything before `write` is
  the answer so far.

```python
write = 0                      # 1 if the first element is always kept
for read in range(write, len(nums)):
    if <nums[read] should be kept>:
        nums[write] = nums[read]
        write += 1
return write                   # length of the kept prefix
```

```
index:   0  1  2  3  4  5
nums:    0  0  1  1  1  2    nums[0] is always kept, so write = 1
read=1:     wr               0 == last kept 0 → skip
read=2:     w  r             1 != 0 → nums[1] = 1, write = 2
read=3:        w  r          1 == last kept 1 → skip
read=4:        w     r       1 == 1           → skip
read=5:        w        r    2 != 1 → nums[2] = 2, write = 3
nums:    0  1  2 | 1  1  2   new length = 3 (what's after write doesn't matter)
```

`read` is always at or ahead of `write`, so a write never overwrites something you still have
to read. Each pointer moves at most n times: **O(n)** time, **O(1)** extra space.

This is the same "two indices, no nested loop" idea as opposite ends, but the job is
different: you aren't searching for a pair, you're **filtering** while you scan. Merging two
sorted arrays is a close relative: one read pointer per input and one write pointer for the
output (fill from the back when the output shares storage with an input).

## Three pointers: the Dutch national flag

Some in-place problems split the array into **three** groups, e.g. all values `< pivot`, then
`== pivot`, then `> pivot`. Use three pointers that keep four regions:

```
[ 0 .. low-1 ]   [ low .. mid-1 ]   [ mid .. high ]   [ high+1 .. n-1 ]
   "small"           "equal"          unexplored          "large"
```

`mid` scans the unexplored region. Each step it either swaps the element into the small or
large region and moves the matching boundary, or leaves it in the middle region. The loop
ends when `mid` passes `high`. It's still one pass and O(1) space. Think carefully about
**which pointer to advance after each kind of swap**. That's the whole difficulty.

In the example below, the array is sorted, so duplicates sit next to each other. Comparing
`nums[read]` with the last kept value, `nums[write - 1]`, is enough to decide.
