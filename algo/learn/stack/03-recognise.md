# How to recognise it

**Strong signals:**
- **Matching / nesting**: brackets, tags, nested structures, "is this well-formed?" The most
  recent opener must close first, so use a stack.
- **Evaluate or parse** an expression, or simplify a path (`a/./b/../c`) → a stack of operands
  or segments.
- **Undo / backtrack the latest thing**: removing adjacent duplicates, browser back, collision of
  moving objects.
- "**Next / previous greater / smaller** element", "days until a warmer day", "span", "largest
  rectangle" → **monotonic stack**, O(n).
- Turning recursion into iteration (iterative DFS, iterative in-order traversal) → an explicit
  stack replaces the call stack.

**Anti-signals: it looks similar, but it's a different pattern:**
- Process in **arrival order** (first in, first out), level by level → a queue, i.e.
  **Breadth-First Search**.
- "The k largest / the next smallest overall" (not the next one *to the right*) → a **heap**.
  A stack only knows its top, not the minimum of everything.
- The natural solution is a function calling itself on a smaller input → write it with
  **Recursion** (it uses the call stack for you). Use an explicit stack only if depth could
  overflow.
- The sliding window **maximum** needs removal from both ends → a monotonic **deque**, which is
  the Sliding Window pattern.

**Complexity:**
- Each element is pushed and popped at most once → O(n) time, O(n) space in the worst case.

**Common pitfalls:**
- Popping from an empty stack. Check `if not stack` first; an early closer is invalid input.
- Forgetting the **leftovers** at the end: unmatched openers mean invalid, and indices left
  in a monotonic stack get the default answer.
- Wrong operand order for `-` and `/`: the first pop is the **right** operand.
- Strict vs non-strict comparison (`<` vs `<=`) in a monotonic stack decides what happens with
  equal values. Pick it on purpose.
- Pushing values when you later need positions. Push indices.
