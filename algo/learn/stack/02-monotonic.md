# Monotonic stack

A **monotonic stack** keeps its contents sorted (always decreasing or always increasing from bottom
to top). Before pushing a new element you pop everything that would break the order, and **each
pop is an answer**: the new element is the "next greater" (or smaller) element for the one popped.

```
nums:  2  7  3  5  4  6  8          stack: elements still waiting for an answer
                                    (values shown here; the code stores their indices)

i=0 (2):  push            stack: [2]
i=1 (7):  7 > 2 → pop 2   ans[2]=7        stack: [7]
i=2 (3):  push            stack: [7, 3]
i=3 (5):  5 > 3 → pop 3   ans[3]=5        stack: [7, 5]
i=4 (4):  push            stack: [7, 5, 4]
i=5 (6):  pop 4, pop 5    ans=6, 6        stack: [7, 6]
i=6 (8):  pop 6, pop 7    ans=8, 8        stack: [8]   ← 8 never gets an answer: -1
```

```python
result = [-1] * n
stack = []                                   # indices; values decreasing bottom → top
for i in range(n):
    while stack and nums[stack[-1]] < nums[i]:
        result[stack.pop()] = nums[i]         # i resolves the waiting index
    stack.append(i)
```

**Why it's O(n):** each index is pushed once and popped at most once, even with the inner
`while`. That's 2n operations in total.

## Variants: choose the comparison and the direction

| You want, for each element… | Keep the stack | Pop while |
|---|---|---|
| next **greater** to the right | decreasing | `nums[top] < nums[i]` |
| next **smaller** to the right | increasing | `nums[top] > nums[i]` |
| previous greater / smaller | same, but read the answer from the **top after popping** | — |
| distance (days until warmer) | store **indices** | answer = `i - j` |

- **Store indices, not values.** You can always look the value up, and you'll often need the
  distance or the position.
- **Circular arrays:** loop `i` over `range(2 * n)` and use `i % n`, pushing only in the first
  pass.
- Histogram / "trapped water" style problems use the popped element as the **bottom** and the new
  top plus `i` as the left and right walls.
