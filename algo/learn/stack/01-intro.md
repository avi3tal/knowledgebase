# Stack

> Fundamental · Data structures: Python `list` (or `collections.deque`) used as a stack

A stack is **last in, first out** (LIFO). You only touch the top: push onto it, pop from it, peek
at it. In Python a plain list is a perfect stack. `append` and `pop()` work at the right end in
O(1).

```figure
push-pop
```

The reason a stack shows up so often: **the most recent unfinished thing is the first one you
can finish.** An opening bracket waits for its closer, an operand waits for its operator, a
function call waits for the calls it made. The latest one to start is always the first to
resolve.

## Operations and their cost

| Operation | Python | Cost |
|---|---|---|
| push | `stack.append(x)` | O(1) amortised |
| pop | `stack.pop()` | O(1) |
| peek | `stack[-1]` | O(1) |
| is empty | `not stack` | O(1) |
| search / access the middle | — | O(n): if you need it, you probably don't want a stack |

Don't use `list.pop(0)` / `insert(0, x)`, because they're O(n). If you need both ends, use
`collections.deque`.

## Template: process, and resolve against the top

```python
stack = []
for x in items:
    if <x opens / is an operand>:
        stack.append(x)                 # wait for later
    else:
        if not stack: <invalid input>   # nothing to match against
        top = stack.pop()               # the most recent unfinished item
        <combine top with x; maybe push the result back>
<check what is left on the stack>       # leftovers are often an error or the answer
```

## Example: postfix expressions

In postfix notation (`5 1 2 + 4 * + 3 -`) every operator applies to the **two most recent**
values. Push numbers. On an operator, pop two, combine them, and push the result back. Pay
attention to the pop order: the first pop is the **right** operand.
