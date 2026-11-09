## Variant 1: find the middle

Same two pointers, no cycle. When the hare can't take another double step, the tortoise is
halfway:

```python
slow = fast = head
while fast is not None and fast.next is not None:
    slow = slow.next
    fast = fast.next.next
return slow
```

**Where `slow` stops on an even length depends on the loop condition:**

```figure
middle-two-conditions
```

- Use the **second** middle when the problem says so (LeetCode's "middle of the list").
- Use the **first** middle when you're about to **split** the list. Merge sort and "reverse
  the second half" both want `slow` to be the last node of the first half, so you can set
  `slow.next = None`.

Trace lengths 1, 2, 3 and 4 by hand once. Off-by-one bugs in this pattern live here.

## Variant 2: where does the cycle start?

Floyd tells you *that* there's a cycle. A second phase tells you *where* it starts:

```python
# phase 1: find any meeting point (template above)
# phase 2:
slow = head                       # reset ONE pointer to the head
while slow is not fast:
    slow = slow.next              # both now move 1 step
    fast = fast.next
return slow                       # the node where the cycle begins
```

**Why it works (distance sketch).** Call the tail length before the cycle `a`, the cycle length
`c`, and let the pointers meet `b` steps past the cycle's entry.

```figure
cycle-entry
```

- The tortoise walked `a + b`. The hare walked twice as far, `2(a + b)`.
- The hare's extra distance is whole laps of the cycle: `2(a + b) − (a + b) = k·c`, so
  `a + b = k·c`.
- Rearranged: **`a = k·c − b`**. Walking `a` steps from the meeting point is the same as
  walking `k` full laps minus `b`, which lands exactly on the entry.
- So a pointer from `head` and a pointer from `meet`, both moving 1 step, arrive at the entry
  **together**, after `a` steps.

Cycle length: once you're at any node in the cycle, walk until you return to it and count.

## Variant 3: cycles in implicit sequences

Nothing in the template needs real nodes. It only needs a **next-function**. Any process
`x → f(x)` over a **finite** set of values must eventually repeat, so it's a linked list
that ends in a loop (a "ρ" shape). Replace `.next` with `f(...)`:

```python
slow, fast = start, f(start)
while slow != fast:
    slow = f(slow)
    fast = f(f(fast))
```

- **Happy number:** `f(x)` = sum of the squares of x's digits. The sequence either reaches
  `1` (which maps to itself) or falls into the loop `4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4`.
  The values are integers, and the trace below compares them with `!=`.
- **Array as a function graph:** if every value of an array is a valid index, then `i → nums[i]`
  is a next-pointer. Starting from index 0, the walk can't go on forever without repeating, so
  it ends in a cycle. If **no value is 0**, nothing points back to index 0, so index 0 sits on
  the tail and not on the cycle. Then the cycle's **entry** has two arrows coming into it: one
  from the tail and one from inside the cycle. That entry is a value two indices share, and
  Variant 2 finds it in O(1) space without modifying the array.
- **Circular arrays:** "move `nums[i]` steps forward, wrapping around" is again a next-function.
  You can detect a loop with fast/slow, adding checks that the direction doesn't flip.

Below, the "list" is the digit-square sequence starting from 172. There's no list in memory,
just two integers. The tortoise walks the tail `172 → 54 → 41 → 17 → 50 → 25 → 29 → 85 → 89`
into the loop, and the hare meets it there without ever seeing a 1.

## Same idea, same speed: a pointer with a head start

The cousin of fast/slow is two pointers moving at the **same** speed with a fixed **offset**.
Give one pointer a k-node head start, then move both until the leader hits the end. The other
pointer is now k nodes from the end. It's a one-pass way to find the k-th node from the end.
