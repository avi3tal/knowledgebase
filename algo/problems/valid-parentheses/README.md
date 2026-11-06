# Valid Parentheses

> Difficulty: **easy** · Patterns: stack · Sources: [leetcode](https://leetcode.com/problems/valid-parentheses/)

## Problem
Given a string `s` made only of the characters `()[]{}`, decide whether it is **valid**:
- every opening bracket is closed by the same type of bracket;
- brackets close in the correct order;
- every closing bracket has a matching opening bracket.

## Examples
- `"()"` → `true`.
- `"()[]{}"` → `true`.
- `"(]"` → `false`.
- `"([)]"` → `false`, because the brackets cross.

## Constraints
- `1 <= len(s) <= 10^4`, and `s` contains only `()[]{}`.
- Target: one pass, O(n) time. A stack of up to O(n) open brackets is needed.

## Pattern & how to recognise it
- **"Matching / nesting / most recent unmatched thing"** → **stack (LIFO)**. The bracket that
  closes next must be the one opened most recently.
- Scanning repeatedly and deleting `"()"` pairs works but is O(n^2). A single counter only
  works for **one** bracket type.
- See [algo/notes/stack.md](../../notes/stack.md).

## Learning material
- **Stack:** push and pop at the top in O(1). In Python use a `list` (`append` / `pop`); in Go
  use a slice (`append`, `s = s[:len(s)-1]`).
- **Map closer → opener:** `{')': '(', ']': '[', '}': '{'}` makes the check one lookup.
- **Two failure modes people forget:**
  1. a closing bracket arrives when the stack is **empty** (`")"`, `"()]"`). Check before you
     pop;
  2. the input ends with brackets still open (`"(("`). The answer is "stack is empty".
- An odd length can return `false` immediately.

## Hints
<details><summary>Hint 1</summary>

When you see a closing bracket, which opening bracket must it match?
</details>
<details><summary>Hint 2</summary>

What if there's nothing to match it with? And what's left over at the end?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For each character: push openers. For a closer, return false if the stack is empty or its top
isn't the matching opener; otherwise pop. At the end, return whether the stack is empty.
Time O(n), space O(n).
</details>

## Follow-ups
- Minimum Add to Make Parentheses Valid (LeetCode 921): a counter is enough for one type.
- Longest Valid Parentheses (LeetCode 32): a stack of indices, or DP.
- Generate Parentheses (LeetCode 22): backtracking with open/close counts.
- Remove the minimum number of invalid parentheses (LeetCode 301): BFS.
