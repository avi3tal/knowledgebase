# Counting and prefix sums

## Counting with a map

Many "are these the same up to order?" questions reduce to **comparing frequency tables**:

```python
from collections import Counter
counts = Counter(s)               # char → how many times
# or, by hand:
counts = {}
for ch in s:
    counts[ch] = counts.get(ch, 0) + 1
```

- For a small fixed alphabet (26 lowercase letters), an array `[0] * 26` indexed with
  `ord(ch) - ord('a')` is the same idea with less overhead. It also works as a hashable key
  (`tuple(counts)`) if you want to group strings by their letters.
- Bucketing ("group items that share a key") is a dict from key → list.

## Prefix sums

`prefix[i]` = sum of the first `i` elements. Any subarray sum becomes one subtraction:

```figure
prefix-range-sum
```

```text
sum(nums[l..r]) = prefix[r + 1] - prefix[l]          O(1) per query after O(n) setup
```

The same trick builds "everything except me" answers. Keep a running product or sum from the
left and another from the right, and combine them, with no division needed.

## Prefix sum + hash map: count subarrays with sum k

A subarray `nums[l..i]` sums to `k` exactly when `prefix_i - prefix_(l-1) = k`, i.e. when an
**earlier prefix equals `prefix_i - k`**. Walk once, keep a map `prefix value → how many times
seen`, and add up the matches:

```python
seen = {0: 1}           # the empty prefix
prefix = count = 0
for x in nums:
    prefix += x
    count += seen.get(prefix - k, 0)
    seen[prefix] = seen.get(prefix, 0) + 1
```

This works **with negative numbers**, which is exactly where a sliding window breaks: adding an
element can make the sum go down, so "shrink while the sum is too big" no longer holds. Watch
the prefix go 3 → 7 → 0 below: the `-7` takes it back to a value already in the map.
