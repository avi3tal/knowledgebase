## How to recognise it

**Strong signals:**
- A **singly linked list** and an **O(1) extra space** requirement. You can't index it, and a
  set of visited nodes or a copy into an array is off the table.
- "Does it **loop**?", "is there a **cycle**?", "where does the cycle **start**?", "how
  **long** is the cycle?"
- "Find the **middle**", or a task that needs it: "split into halves", "is it a
  **palindrome**?", "reorder first half with reversed second half".
- "**k-th from the end**" in one pass. That's two pointers on the same list with an offset.
- An **implicit next-function** over a finite set of values: digit transforms, `i → nums[i]`,
  "jump `nums[i]` steps in a circular array". These must eventually repeat, so look for the cycle.

**Anti-signals: it looks similar, but it's a different pattern:**
- **Pairs** in a **sorted** array (pair sum, triplets, remove duplicates in place) → **Two
  Pointers**. The pointers walk from the two ends (or one reads, one writes). They aren't
  chasing each other along one path.
- A **contiguous** subarray or substring with a condition (longest, shortest, at most k) →
  **Sliding Window**. Both ends move forward, but the question is about what's *between* them.
- **Reversing** a list or a sub-list (between positions, every k nodes, rotate) → **In-place
  Reversal of a LinkedList**. Fast/slow often *finds* the midpoint for a reversal, but the
  rewiring is its own pattern.
- Values in **1..n** where you may **modify** the array and want *all* missing or duplicate
  values → **Cyclic Sort**. Floyd on indices is for the read-only, O(1)-space, single-duplicate
  version.
- A **hash set** of visited nodes or values also detects a cycle in O(n) time. Fall back to
  it (Arrays & Hashing) only when O(n) space is allowed. When the problem says O(1) extra
  space, it's asking for Floyd.

**Complexity:**
- Time **O(n)**. On a list with a tail end, the hare reaches it in n/2 rounds. With a cycle,
  the pointers meet within (tail length + cycle length) rounds. Finding the cycle's start
  adds at most n more steps.
- Space **O(1)**: two pointers, whatever the input size.

**Common pitfalls:**
- **Null checks:** test `fast is not None and fast.next is not None` before
  `fast = fast.next.next`. Testing only `fast.next` crashes on an empty list, and testing only
  `fast` crashes on the last node.
- **The even-length middle:** `while fast and fast.next` stops on the *second* middle, and
  `while fast.next and fast.next.next` on the *first*. Pick the one the problem needs, and use
  the first when you split the list.
- **Value vs identity:** compare nodes with `is`, not `==` on `.val`. Duplicate values are
  normal.
- **Starting positions:** in an implicit sequence, if `slow` and `fast` both start at `x`,
  a `while slow != fast` loop never runs. Either start `fast = f(x)` or use a do-while shape.
- **Phase 2 reset:** reset only *one* pointer to the head, and move *both* by 1. Moving the
  hare by 2 in phase 2 is a classic bug.
