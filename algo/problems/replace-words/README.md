# Replace Words

> Difficulty: **medium** · Patterns: trie, strings · Sources: [leetcode](https://leetcode.com/problems/replace-words/)

## Problem
You get a `dictionary` of **roots** and a `sentence` of words separated by single spaces. Replace
every word that **starts with** some root by that root. If several roots match, use the
**shortest** one. Words with no matching root stay as they are. Return the new sentence.

## Examples
- `dictionary = ["cat", "bat", "rat"]`, `sentence = "the cattle was rattled by the battery"` →
  `"the cat was rat by the bat"`.
- `dictionary = ["a", "b", "c"]`, `sentence = "aadsfasf absbs bbab cadsfafs"` → `"a a b c"`.
- `dictionary = ["a", "aa", "aaa"]`, `sentence = "aaaa aa"` → `"a a"`: the shortest root wins.

## Constraints
- `0 <= dictionary.length <= 1000`, `1 <= dictionary[i].length <= 100`.
- `1 <= sentence.length <= 10^6`, lowercase letters and single spaces, no leading/trailing spaces.
- Checking every root against every word is O(words × roots × L). Aim for O(total characters).

## Pattern & how to recognise it
- "Does this word **start with** any of these strings, and which is the **shortest**?" →
  insert the roots into a **trie**, then walk each word down it and stop at the first
  end-of-word node.
- A hash set of roots also works if you try each prefix length of the word (O(L²) per word for
  slicing). The trie makes it a single O(L) walk.
- Lesson: [Trie](../../learn/trie/01-intro.md).

## Learning material
- Walking a word down a trie visits its prefixes from shortest to longest, so the **first**
  end-of-word marker you meet is the shortest matching root.
- If the walk falls off the trie (missing child), no root is a prefix of this word.
- [Trie (Wikipedia)](https://en.wikipedia.org/wiki/Trie)

## Hints
<details><summary>Hint 1</summary>

Put all roots in a structure where checking "is any root a prefix of this word" doesn't depend
on how many roots there are.
</details>
<details><summary>Hint 2</summary>

While walking a word through the trie, when can you stop early, and what do you output?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Insert every root into a trie with end flags. For each word, walk character by character: if the
current node is marked as an end, output the prefix walked so far; if the next character is
missing, output the whole word. Join the results with spaces.

Expected complexity: time O(total characters of dictionary + sentence), space O(total dictionary
characters).

</details>

## Follow-ups
- Return the **longest** matching root instead.
- Roots arrive and disappear over time (add a delete with pass-through counts).
- Do it with a hash set of roots and compare the constants.
