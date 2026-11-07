# Alien Dictionary

> Difficulty: **hard** · Patterns: topological-sort · Sources: [leetcode](https://leetcode.com/problems/alien-dictionary/)

## Problem
An alien language uses lowercase English letters, but in an unknown order. You're given a list
of `words` that is **sorted lexicographically** by the alien alphabet. Return a string of the
**unique letters** that appear in `words`, ordered so that the sorting is consistent with it.
If several orders work, return any of them. If no order works, return `""`.

Lexicographic order works as usual: compare letter by letter, and at the first difference the
smaller letter wins. If one word is a **prefix** of the other, the shorter word comes first.

## Examples
- `words = ["wrt", "wrf", "er", "ett", "rftt"]` → `"wertf"`.
- `words = ["z", "x"]` → `"zx"`.
- `words = ["z", "x", "z"]` → `""`: z < x and x < z.
- `words = ["abc", "ab"]` → `""`: a longer word can't come before its own prefix.

## Constraints
- `1 <= len(words) <= 100`, `1 <= len(words[i]) <= 100`, lowercase English letters.
- Every letter that appears must be in the answer, even letters no comparison mentions.
- Any valid order is accepted (the tests list every valid order).

## Pattern & how to recognise it
- "Sorted by an unknown order", "find the order" → infer **precedence edges** between letters,
  then **Topological Sort** them.
- Only **adjacent** words carry information, and only at their **first differing position**.
- Lesson: [Topological Sort](../../learn/topological-sort/02-variants.md).

## Learning material
- **Implicit graph:** nodes are the letters, and each adjacent pair of words gives at most one
  directed edge (the first mismatch). Letters that never differ still need to be nodes.
- **Kahn's algorithm** then yields an order, or reveals a cycle (`len(order) < #letters`).
- Comparing non-adjacent words adds nothing: sortedness is transitive.
- [Topological sorting (Wikipedia)](https://en.wikipedia.org/wiki/Topological_sorting)

## Hints
<details><summary>Hint 1</summary>

Compare `words[i]` with `words[i + 1]`. What exactly do you learn, and what do you learn after
the first differing letter?
</details>
<details><summary>Hint 2</summary>

There's one way the input can be invalid without any cycle. What if the two words don't differ
at all within the shorter length?
</details>
<details><summary>Hint 3</summary>

Add every letter as a node first. Then build edges, avoid counting a duplicate edge twice, and
run Kahn's.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Nodes = all letters (in-degree 0). For each adjacent pair, find the first `j` with
`w1[j] != w2[j]` and add edge `w1[j] → w2[j]` (once). If there's no such `j` and `len(w1) >
len(w2)`, return `""`. Run Kahn's. If not every letter is output, return `""`, else join the
order.

Expected complexity: time O(C), the total number of characters; space O(1) (at most 26 letters
and 26² edges).

</details>

## Follow-ups
- Return the lexicographically smallest valid order (in the normal alphabet).
- Decide whether the order is **unique** (the queue never holds more than one letter).
- Verifying an Alien Dictionary (LeetCode 953): the order is given, so check the words.
