# Valid Palindrome

> Difficulty: **easy** · Patterns: two-pointers · Sources: [leetcode](https://leetcode.com/problems/valid-palindrome/), [interviewbit](https://www.interviewbit.com/problems/palindrome-string/)

## Problem
Given a string `s`, return `true` if it is a palindrome once you keep only the **alphanumeric**
characters (letters and digits) and **ignore case**. Otherwise return `false`. An empty string
(or one with no alphanumerics) is a palindrome.

## Examples
- `"A man, a plan, a canal: Panama"` → `true`, because it reduces to `amanaplanacanalpanama`.
- `"race a car"` → `false`, because it reduces to `raceacar`.
- `" "` → `true`, because it reduces to the empty string.

## Constraints
- `0 <= len(s) <= 2 * 10^5`, and the characters are printable ASCII.
- Target: one pass, O(n) time, **O(1) extra space**. Don't build the filtered copy.

## Pattern & how to recognise it
- **"Palindrome" + "ignore some characters"** → **two pointers moving inward** from both ends.
  Skip characters that don't count, then compare the two current characters.
- The naive version (filter, lowercase, reverse, compare) is also O(n), but it needs O(n) extra
  space. The two-pointer version shows you can do the filtering on the fly.
- See [algo/notes/patterns.md](../../notes/patterns.md).

## Learning material
- **Converging two pointers:** `i = 0, j = n - 1`. While `i < j`, advance `i` past skippable
  characters and retreat `j` past skippable characters, both **bounded by `i < j`**. Then compare
  and move both inward. Each index is visited at most once, so the loop is O(n).
- **Bounds while skipping:** an inner `while i < j and not s[i].isalnum()` keeps `i` inside the
  string even when everything left is punctuation. That's the classic bug spot.
- `str.isalnum()` and `str.lower()` in Python. In Go, use `unicode.IsLetter` / `unicode.IsDigit`
  and `unicode.ToLower` (or plain byte checks for ASCII).
- Reference: https://leetcode.com/problems/valid-palindrome/editorial/

## Hints
<details><summary>Hint 1</summary>

Compare the first and last *meaningful* characters. If they match, the problem shrinks.
</details>
<details><summary>Hint 2</summary>

What happens to your pointer when the rest of the string is all punctuation?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Start with `i, j = 0, n - 1`. While `i < j`: skip non-alphanumerics from the left (with `i < j`
checked), then from the right. If `lower(s[i]) != lower(s[j])`, return false. Otherwise
`i += 1, j -= 1`. If the loop ends, return true. Time O(n), space O(1).
</details>

## Follow-ups
- Valid Palindrome II (LeetCode 680): can it become a palindrome by deleting **at most one**
  character? On the first mismatch, try skipping either side.
- [Palindrome Number](../palindrome-number/README.md): the same question for an integer,
  without converting it to a string.
- Longest Palindromic Substring (LeetCode 5): expand around centres.
