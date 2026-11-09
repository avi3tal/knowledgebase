# Prefix Sum

> Fundamental · Data structures: array, hash map

"What is the sum of `nums[l..r]`?" costs O(r − l) to add up directly. Ask it q times and you pay
O(n · q). A **prefix sum** array pays O(n) once and then answers every range in **O(1)**:

```figure
prefix-array
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
