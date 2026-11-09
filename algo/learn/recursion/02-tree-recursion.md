# Tree recursion, helpers and accumulators

## More than one recursive call

When a function calls itself **twice or more**, the calls form a tree. The leaves are base cases,
and the stack only ever holds **one root-to-leaf path**. So space is the **depth**, while time is
the **number of nodes** in the tree.

```figure
binary-strings-tree
```

This "choose, recurse, then try the next choice" shape is the starting point of
**Backtracking** (where you also undo the choice and prune bad branches) and **Subsets**.

## Helper with extra parameters

The public signature often lacks what the recursion needs: a position, a partial answer, an
output list. Wrap an inner helper:

```python
def solve(nums):
    def go(i, acc):              # i = how far we got; acc = the answer so far
        if i == len(nums):
            return acc           # base case: nothing left to process
        return go(i + 1, <acc updated with nums[i]>)
    return go(0, <initial acc>)
```

- **Pass an index instead of slicing.** `nums[1:]` copies the list on every call, which turns an
  O(n) recursion into O(n²).
- Immutable values (`str`, a tuple, `prefix + "0"`) are safe to pass down. Each frame has its
  own copy. A **shared mutable** list needs an explicit undo after the call (backtracking).

## Divide and conquer

Split the input into halves, solve each half recursively, and combine. The recurrence
`T(n) = 2·T(n/2) + O(n)` gives O(n log n). `T(n) = T(n/2) + O(1)` gives O(log n). **Halving** the input instead of shrinking it by one is what turns O(n) into O(log n).

## When the same subproblem repeats

If the recursion tree calls the same arguments many times (naive Fibonacci recomputes `f(n-2)`
over and over), cache the results: that's **Dynamic Programming** (memoisation).
