## How to recognise it

**Strong signals:**
- "Return **all** subsets / combinations / strings you can form". The output is a list of every
  possibility.
- Each element or position is an **independent choice** from a small set: take/skip,
  lower/upper, keep/abbreviate, one letter per digit.
- **Tiny limits** (n ≤ 10–15) because the answer has 2ⁿ (or kⁿ) items.
- "No duplicate subsets" with an input that has duplicates → sort, then extend only the last
  step's subsets.

**Anti-signals: it looks similar, but it's a different pattern:**
- **Every choice must satisfy a constraint against earlier choices** (queens can't attack each
  other, a combination must hit a target sum, a path can't reuse a cell) and most branches die
  early → **Backtracking**. Subsets generates *all* combinations; backtracking searches for the
  *valid* ones and undoes choices at dead ends.
- **Orderings** of all the elements (n! results, not 2ⁿ) → permutations. You can build them BFS
  style (insert at every position) or with backtracking (choose an unused element per position).
  Ask "does order matter?": subsets/combinations say no, permutations say yes.
- Only the **count** or the **best** subset is wanted (max profit under a capacity, can the set
  be split into equal sums) → **0/1 Knapsack** (DP), polynomial in n × capacity instead of 2ⁿ.
- A **contiguous** subarray or substring → **Sliding Window** or prefix sums, not subsets.
  "Subarray" is contiguous; "subset" and "subsequence" are not.

**Complexity:**
- Subsets: time and space O(n · 2ⁿ): 2ⁿ results of up to n elements.
- k choices per position: O(n · kⁿ).
- Permutations: O(n · n!).

**Common pitfalls:**
- Iterating over the list you're appending to. Freeze `size = len(result)` first.
- Mutating a subset instead of copying it, which corrupts the subsets that share it.
- Duplicates: forgetting to **sort** before the "extend only the last step" trick. The trick only
  works when equal values are adjacent.
- The empty input still has one subset: `[[]]`, not `[]`.
