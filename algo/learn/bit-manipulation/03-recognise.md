## How to recognise it

**Strong signals:**
- The statement talks about **binary representations**, set bits, powers of two, or "32-bit
  integers".
- **O(1) extra space** with values that repeat a fixed number of times (count per bit).
- A **small universe** (letters, ≤ 20 items) where sets are compared or enumerated → bitmasks.
- "Without using + / * / division" → shifts and masks.
- Constraint `n ≤ 20` together with "subsets" or "assignments" → 2ⁿ masks.

**Look-alikes and how to tell them apart:**
- **Pairs cancel** (every value twice except one or two; find the missing number) →
  **Bitwise XOR**: one running XOR, no per-bit counting needed.
- **List all subsets** as output → **Subsets** (iterative/BFS build-up). A bitmask loop is just
  another way to write it.
- **Best value over subsets** with overlapping subproblems (TSP, partition into k groups) →
  **Dynamic Programming** with a mask in the state.
- **Digit / divisibility arithmetic** (reverse an integer, palindromic number, gcd) →
  **Math**. Those work in base 10, not on bits.
- **Max XOR of a pair** among many numbers → a binary **Trie**.

**Complexity:**
- Single-bit operations are O(1). Loops over bits are O(word size) = O(32) or O(64), so constant.
- Kernighan's loop: O(number of set bits). Enumerating all masks: O(2ⁿ).

**Common pitfalls:**
- Operator precedence: in Python `x & 1 == 0` parses as `x & (1 == 0)`. Parenthesise:
  `(x & 1) == 0`.
- Negative numbers in Python: `while x:` loops forever on negative `x`. Mask to 32 bits.
- Stopping a 32-bit loop "while n > 0" loses leading zeros (reverse bits).
- Arithmetic vs logical right shift on signed types in Go/Java/C (`>>` vs `>>>`).
- `1 << k` overflowing a 32-bit int for k ≥ 31 in typed languages. Use `1 << k` on a 64-bit or
  unsigned type.
