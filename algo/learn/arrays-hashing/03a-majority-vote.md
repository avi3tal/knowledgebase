## Counting, then counting smarter: majority element

"Return the value that appears **more than n/2 times**" is a counting problem. The map version is
three lines: `count[x]++`, and **return `x` the moment `count[x] > n/2`**. No best-so-far struct,
no break-then-decide: when the statement guarantees an answer, return as soon as you see it.
(In Go a missing map key reads as `0`, so `count[x]++` needs no existence check.)

The **Boyer-Moore vote** drops the map: keep one `candidate` and a `count`. A match is a vote
for, a different value is a vote against, and when `count` hits 0 the next value takes over.
Each majority vote can only be cancelled by one non-majority vote, and there are fewer of those,
so the majority survives. O(n) time, **O(1) space**.

The catch: the survivor is only guaranteed correct when a majority **exists**. If it might not,
count the candidate in a second pass (that's `majority-element-ii`, with two candidates for n/3).
Practise: `majority-element`, `max-consecutive-ones` (one running counter that resets), then
`majority-element-ii`.
