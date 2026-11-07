## Variants: what a cell means, and what a mismatch does

Every problem here keeps the prefix pair `(i, j)` as the state. They differ in **what a cell
stores** and in the rule for the **mismatch** case.

**1. Substring vs subsequence. This is the pattern's name, so get it right.**
- A *subsequence* may skip characters. A mismatch doesn't break anything, so it inherits the
  best of the neighbouring prefixes (the LCS rule above). The answer is the bottom-right cell.
- A *substring* is contiguous. A cell has to mean "the common run that **ends exactly at**
  `a[i-1]` and `b[j-1]`". A match extends the diagonal run, but a mismatch **breaks** the run,
  so that cell resets to zero. Because the best run can end anywhere, the answer is the
  **largest cell anywhere in the table**, not the corner.

The two tables look alike, but the cell meanings ("best so far" vs "ending here") are
different. Mixing them up is the classic bug.

**2. Edit distance and its relatives (the cost of transforming a into b).**
The cell stores a **minimum cost** instead of a maximum length. On a match the last characters
cost nothing. On a mismatch, each allowed operation corresponds to one neighbouring cell
(up, left or up-left), and you take the cheapest. The base row and column are **not** zero
here. Ask yourself what it costs to turn a prefix into the empty string. Related problems:
minimum insertions and deletions to turn a into b, shortest common supersequence, and
interleaving strings (a boolean table).

**3. One sequence against itself (increasing subsequences).**
"Longest increasing subsequence" and "maximum-sum increasing subsequence" have only one
array, but the same idea applies. The state is "the best subsequence that **ends at index
i**", and you look back at every earlier index `j < i` that can come before it. That's a 1-D
table with an O(n) look-back per cell: O(n²) in total. Like the substring variant, the
answer is the **best cell anywhere**, because the best subsequence can end at any index.
(LIS also has an O(n log n) method using binary search over "smallest tail per length".)

**Space.** Row `i` reads only row `i-1`, so two rows (or one row plus a saved diagonal value)
are enough: O(min(n, m)) space. You need the full table only to **reconstruct** the actual
subsequence or the list of edits. To do that, walk back from the answer cell, following the
choice each cell made.
