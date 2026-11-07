# Recursion

> Fundamental · Data structures: the call stack

A recursive function solves a problem by **calling itself on a smaller version of the same
problem**, then using that answer to build its own. Every recursive function has two parts:

1. **Base case**: an input small enough to answer directly. Without one, the calls never stop.
2. **Recursive case**: shrink the input, recurse, and **combine** the result.

```python
def solve(x):
    if <x is trivial>:
        return <direct answer>          # base case
    smaller = <shrink x>                # must move toward the base case
    sub = solve(smaller)                # trust it: assume it's correct
    return <combine x's part with sub>  # build the answer on the way back
```

The key mental move is the **leap of faith**: when writing the recursive case, *assume* the call
on the smaller input returns the right answer. Don't trace it in your head. Check only that
(a) the base case is right, (b) the input really shrinks, and (c) the combine step is right.
This is the same reasoning as a proof by induction.

## What actually happens: the call stack

Each call gets its own **frame** with its own local variables, pushed on the call stack. A frame
pauses at the recursive call and resumes when the deeper call returns:

```
digit_sum(4987)                  last = 7, waiting…
  digit_sum(498)                 last = 8, waiting…
    digit_sum(49)                last = 9, waiting…
      digit_sum(4)  → 4          base case
    ← 9 + 4  = 13
  ← 8 + 13 = 21
← 7 + 21 = 28
```

Work happens in two phases: **on the way down** (before the call: splitting the input) and **on
the way back up** (after the call: combining). Many bugs come from doing something in the
wrong phase.

## Cost

- **Time** = (number of calls) × (work per call, not counting the recursive calls).
- **Space** = the **maximum depth** of the call stack × the size of each frame. This is easy to
  forget: a linear recursion over n items uses O(n) stack space even if it allocates nothing.

| Shape | Calls | Depth (space) | Example |
|---|---|---|---|
| shrink by 1, one call | n | n | sum of a list, digits |
| halve, one call | log n | log n | binary search on a range |
| halve, two calls + O(n) combine | n | log n | merge sort: O(n log n) time |
| shrink by 1, two calls | 2ⁿ | n | all subsets, naive Fibonacci |

Python's default recursion limit is about 1000 frames (`sys.setrecursionlimit` raises it, but deep
recursion can still crash the interpreter). For linear recursion over large inputs, use a loop.
