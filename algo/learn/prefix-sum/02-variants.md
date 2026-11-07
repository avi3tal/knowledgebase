## Prefix sums + a hash map: counting subarrays

The big interview use: **count or measure subarrays with a sum condition** when values can be
**negative**, which breaks the sliding window.

A subarray `nums[i..j]` has sum `P[j+1] − P[i]`. So while scanning, at each position ask: *how
many earlier prefixes `p` make the difference work?* Store the earlier prefixes in a hash map.

| Question | Condition on an earlier prefix p | Map stores |
|---|---|---|
| count subarrays with sum k | `p == prefix − k` | prefix → count |
| longest subarray with sum k | `p == prefix − k` | prefix → **first** index |
| count sums divisible by k | `p mod k == prefix mod k` | remainder → count |
| equal 0s and 1s | count 0 as −1, then sum 0 | balance → first index |

```python
seen = {0: 1}               # the empty prefix, so subarrays starting at index 0 count
prefix = count = 0
for x in nums:
    prefix += x
    count += seen.get(<key matching prefix>, 0)    # look up BEFORE inserting
    seen[<key of prefix>] = seen.get(<key of prefix>, 0) + 1
```

The animation counts subarrays whose sum is divisible by 5. Two prefixes with the same
**remainder** enclose a subarray whose sum is a multiple of 5. Python's `%` already returns a
non-negative remainder for negative numbers; in Go or Java use `((p % k) + k) % k`.

## More members of the family
- **Prefix products / suffix products:** product of everything except `nums[i]` = (product to the
  left) × (product to the right), no division needed.
- **Prefix XOR:** `xor(l..r) = X[r+1] ^ X[l]`. Same identity, different operator.
- **2-D prefix sums:** `S[r+1][c+1] = grid[r][c] + S[r][c+1] + S[r+1][c] − S[r][c]`; any
  rectangle sum is 4 lookups (inclusion–exclusion).
- **Difference array (the inverse):** to add `v` to every element of `[l, r]` many times, do
  `D[l] += v; D[r+1] −= v`, then one prefix sum over `D` rebuilds the array. O(1) per update.
- **Prefix sums on a tree path:** the same "count earlier prefixes equal to `prefix − k`" works
  along a root-to-node path, as long as you remove the prefix again when you backtrack.
