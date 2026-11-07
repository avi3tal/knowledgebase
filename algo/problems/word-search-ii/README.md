# Word Search II

> Difficulty: **hard** · Patterns: trie, backtracking · Sources: [leetcode](https://leetcode.com/problems/word-search-ii/)

## Problem
You get a grid of letters `board` (one string per row) and a list of distinct `words`. Return
every word that can be traced on the board by starting at some cell and repeatedly stepping to a
horizontally or vertically **adjacent** cell, without using the same cell twice within one word.
The order of the result doesn't matter.

## Examples
- `board = ["oaan", "etae", "ihkr", "iflv"]`, `words = ["oath", "pea", "eat", "rain"]` →
  `["eat", "oath"]`.
- `board = ["ab", "cd"]`, `words = ["abcb"]` → `[]`: you can't reuse the `b` cell.
- `board = ["ab"]`, `words = ["ba", "ab", "a", "aba"]` → `["ba", "ab", "a"]`.

## Constraints
- `1 <= rows, cols <= 12`, lowercase letters.
- `1 <= words.length <= 3 * 10^4`, `1 <= words[i].length <= 10`, words are distinct.
- Running the single-word search (Word Search I) once per word repeats the same grid walks
  thousands of times. Search **all words at once**.

## Pattern & how to recognise it
- Many words, one grid, shared prefixes → put the words in a **trie** and run **one**
  backtracking DFS from every cell, moving down the trie as you move across the grid.
- The trie prunes the search: as soon as the letters walked so far are not a prefix of any word,
  stop exploring that direction.
- Lessons: [Trie](../../learn/trie/01-intro.md), [Backtracking](../../learn/backtracking/01-intro.md).

## Learning material
- **Backtracking on a grid:** mark the cell as used, recurse into the 4 neighbours, unmark.
- **Trie-guided DFS:** carry the current trie node instead of an index into one word. A node
  with an end marker (store the whole word there) means a word was found.
- **Pruning tricks:** remove the word from the trie once found (no duplicates in the output),
  and delete leaf nodes that have no words left so later searches skip dead branches.
- [Trie (Wikipedia)](https://en.wikipedia.org/wiki/Trie)

## Hints
<details><summary>Hint 1</summary>

Instead of asking "where is this word?", ask from each cell "which words could start here?".
What lets you answer that for all words at once?
</details>
<details><summary>Hint 2</summary>

During the DFS, what state replaces "index into the word"? When do you stop recursing?
</details>
<details><summary>Hint 3</summary>

How do you avoid reporting the same word twice when it can be traced along several paths?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Build a trie of the words, storing the full word at its end node. From every cell, DFS with
`(r, c, node)`: if `board[r][c]` isn't a child of `node`, return; otherwise move to that child,
record and clear its stored word if present, mark the cell, recurse into the 4 neighbours, then
unmark. Optionally prune the child from the trie when it has no children and no word left.

Expected complexity: time O(cells × 4 × 3^(L−1)) in the worst case for maximum word length L;
in practice the trie pruning keeps it near O(cells) for a fixed L. Space O(total word characters).

</details>

## Follow-ups
- Allow diagonal moves (8 neighbours).
- Return how many times each word can be traced.
- Why is this faster than Word Search I run per word? Give a worst case for both.
