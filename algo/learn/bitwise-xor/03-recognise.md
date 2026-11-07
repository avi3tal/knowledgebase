## How to recognise it

**Strong signals:**
- "Every element appears **twice** (or an even number of times) **except** one or two." That's
  the cancellation rule.
- **One missing** or **one extra** value against a known set: `0..n` with a gap, a string with
  one extra letter. XOR the expected set with the actual one.
- **"Flip"**, **"invert"**, **"toggle"**, **"complement"** of bits or 0/1 values. That's XOR
  with a mask.
- **O(1) extra space** with an unsorted array, where a counter or set would be the obvious
  answer.
- "Positions where the bits differ", Hamming distance, or "swap without a temp".

**Anti-signals: it looks similar, but it's a different pattern:**
- You need **all** missing or **all** duplicate values from `1..n` → **Cyclic Sort**. XOR folds
  everything into one number, so with several unknowns the information is mixed together.
  (Two unknowns can still be split by a differing bit. Beyond that, XOR is the wrong tool.)
- Every element appears **three** times except one → **Bit Manipulation** in general:
  count each bit column modulo 3. XOR cancels pairs only, never triples.
- Frequencies, "the most common", or values that appear an arbitrary number of times →
  **Arrays & Hashing** (a counter).
- The **one duplicate** in a read-only array of `n + 1` values from `1..n` → **Fast & Slow
  Pointers**. The duplicate may appear more than twice, which breaks the pairing.
- Arithmetic on digits, bases or overflow without bit identities → **Math**.

**Complexity:**
- Time **O(n)** for the fold, O(n · w) when you loop over the bits of each number (w = word
  width, usually treated as a constant).
- Space **O(1)**: a running accumulator, plus a mask.

**Common pitfalls:**
- **Start the fold at 0,** not at `nums[0]` combined with a loop over everything. That XORs
  the first value twice and cancels it.
- **Precedence:** Python and Go bind `^` tighter than `==`, so `a ^ b == 0` means
  `(a ^ b) == 0` there. C and Java do the opposite: it means `a ^ (b == 0)`. Parenthesise
  anyway, `(a ^ b) == 0`, so the code reads the same in every language.
- **The mask width for a complement:** `~x` in Python is `-x - 1` (infinite leading ones), not
  "flip the visible bits". Build an explicit mask of `bit_length` ones instead.
- **Zero edge cases:** `0` has `bit_length() == 0`, but its complement is `1`. Treat it
  separately.
- **Odd-count assumption:** the fold returns the XOR of every value that appears an odd number
  of times. If the "exactly twice" promise is broken, the answer is garbage. It won't raise an
  error.
