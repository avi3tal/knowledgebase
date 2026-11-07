## Variant 1: top k by a key (closest, most frequent)

The heap stores `(key, item)` pairs, and the rule is the same: the heap points away from the
question.
- **k closest points to the origin:** the key is the squared distance `x² + y²` (no `sqrt`
  needed, since it preserves the order). You want the k smallest distances, so keep a max-heap
  `(-dist, x, y)` of size k.
- **k most frequent:** count with a hash map first (O(n)), then keep a size-k **min**-heap of
  `(count, value)`. The heap only ever sees distinct values, so this is O(n + d log k).
- **Bucket sort** alternative for frequency: a frequency is at most n, so make buckets
  `0..n` and walk them from the top. That's O(n), with no heap at all.

## Variant 2: repeated extraction (always take the smallest two)

Some problems aren't "keep the k best" but "**repeatedly take the best and put something back**":
- **Connect ropes:** pop the two shortest, pay their sum, push the joined rope back. Short ropes
  get paid for again in every later join, so they should be joined first (the same greedy as
  Huffman coding).
- **Rearrange string / task scheduler:** pop the most frequent character, use it, and hold it
  back for one turn so it isn't used twice in a row.

Start with `heapify` (O(n)), then each round is O(log n).

## Variant 3: "remove k to maximise distinct" (frequency as the key)

Some problems hide the k in a budget: "remove exactly k elements so that the number of distinct
elements is as large as possible".
- Values that appear once are already distinct, so leave them alone.
- A duplicated value with count c costs `c − 1` removals to become distinct. Fix the **cheapest
  ones first**: a min-heap by count, popped while the budget lasts.
- Budget that can't fix the next value isn't wasted: dump it into that value's spare copies. Only
  when every value is already distinct does each extra removal delete a distinct one.

## Quickselect: when you only need the k-th element, once

Quickselect partitions like quicksort but only recurses into the side that contains index k. It's
**O(n) on average** (O(n²) worst case) and works in place. Use it when the input is an array in
memory and you need the answer once. Use the heap for streams, for repeated queries and when you
need guaranteed O(n log k).

The trace below joins the ropes `1 3 11 5 2`. Watch the joined rope go back into the heap: `3`
(from 1 + 2) is joined again right away with the original 3.
