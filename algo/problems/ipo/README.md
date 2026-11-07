# IPO (Maximize Capital)

> Difficulty: **hard** · Patterns: two-heaps, greedy · Sources: [leetcode](https://leetcode.com/problems/ipo/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
You have `w` capital and may complete **at most `k`** distinct projects, one after another.
Project `i` needs at least `capital[i]` to start (the capital isn't spent) and, once completed,
adds `profits[i]` to your capital.

Return the **maximum capital** you can have after finishing at most `k` projects.

## Examples
- `k = 2, w = 0, profits = [1,2,3], capital = [0,1,1]` → `4`. Start project 0 (capital 0 → 1).
  Now projects 1 and 2 are affordable, and project 2 pays more: 1 + 3 = 4.
- `k = 3, w = 0, profits = [1,2,3], capital = [0,1,2]` → `6`.
- `k = 2, w = 0, profits = [5,6], capital = [1,2]` → `0`: nothing is affordable.

## Constraints
- `1 <= k <= 10^5`, `0 <= w <= 10^9`, `1 <= n <= 10^5`.
- `0 <= profits[i] <= 10^4`, `0 <= capital[i] <= 10^9`.
- n and k up to 10^5 rule out scanning all projects for every pick (O(n·k)). Aim for O(n log n).

## Pattern & how to recognise it
- Two **different orders** over the same projects: *when* a project becomes affordable (by
  capital) and *which* affordable project is best (by profit). That's the two-heaps "unlock, then
  pick the best" shape.
- Greedy is safe: profits are never negative and capital is never spent, so taking the most
  profitable affordable project can only unlock more.
- Lesson: [Two Heaps](../../learn/two-heaps/01-intro.md) (Variant 2 in the variants).

## Learning material
- A **min-heap by requirement** works as a gate: everything below the current capital comes out in
  order, and each project leaves it once.
- A **max-heap by reward** picks the best of the released items in O(log n).
- Exchange argument: if an optimal plan picks some project before a more profitable one that was
  also affordable, swapping them never lowers the capital at any later step.

## Hints
<details><summary>Hint 1</summary>

At any moment, which projects could you start? Of those, is there any reason not to take the most
profitable one?
</details>
<details><summary>Hint 2</summary>

Your capital only grows. Keep the locked projects ordered by capital needed, and move them to a
"pickable" heap ordered by profit as soon as you can afford them.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Push `(capital[i], profits[i])` into a min-heap `locked`. Repeat `k` times: while `locked`'s top
needs ≤ `w`, pop it and push its profit into the max-heap `available`. If `available` is empty,
stop. Otherwise pop the largest profit and add it to `w`. Return `w`.

(Sorting the projects by capital with a pointer replaces the first heap and works just as well.)

Time O(n log n + k log n), space O(n).
</details>

## Follow-ups
- Projects cost capital (it's spent, and profit is the net gain): the greedy needs rethinking.
- Return the list of chosen projects, in order.
- Each project can be done any number of times.
