# Prefix Sum

> Fundamental · Data structures: array, hash map

"What is the sum of `nums[l..r]`?" costs O(r − l) to add up directly. Ask it q times and you pay
O(n · q). A **prefix sum** array pays O(n) once and then answers every range in **O(1)**:

```
index:      0    1    2    3    4    5
nums:       3   -1    4    2   -5    6
P:      0   3    2    6    8    3    9         P[i] = nums[0] + … + nums[i-1]

sum(nums[1..3]) = P[4] - P[1] = 8 - 3 = 5      (-1 + 4 + 2)
```

**The identity:** `sum(nums[l..r]) = P[r + 1] − P[l]`. The extra leading `0` (`P[0]`, the empty
prefix) means ranges that start at index 0 need no special case.

## Template: build once, query in O(1)

```python
P = [0] * (len(nums) + 1)
for i, x in enumerate(nums):
    P[i + 1] = P[i] + x

def range_sum(l, r):          # inclusive
    return P[r + 1] - P[l]
```

| | Build | Query | Space |
|---|---|---|---|
| no preprocessing | — | O(n) | O(1) |
| prefix sums | O(n) | O(1) | O(n) |
| running sum while scanning | — | — | O(1) |

Often you don't even need the array. When you scan left to right, a running total **is** the
current prefix sum. That's how "pivot index" is solved: `right = total − left − nums[i]`.

Below: build `P`, then answer three range queries. Each one is a single subtraction, however long
the range.
