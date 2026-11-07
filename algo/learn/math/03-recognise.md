## How to recognise it

**Strong signals:**
- The input is **one number** (or a few) and the question is about its digits, divisors, primes,
  or representation.
- "Modulo 10⁹ + 7", "32-bit signed integer", "without converting to a string".
- n up to 10⁹ or more with O(1) / O(log n) expected → there must be a **formula** or a halving loop.
- Absolute differences or sums over all pairs → expand the algebra or count contributions.

**Look-alikes and how to tell them apart:**
- **Integer sqrt / the smallest x such that …** with a monotone condition →
  **Modified Binary Search** on the answer.
- **Bits, powers of two, XOR tricks** → **Bit Manipulation** / **Bitwise XOR**.
- **Repeated transformation of a number that might loop** (happy number) →
  **Fast & Slow Pointers** for cycle detection.
- **Counting ways** with overlapping choices (climbing stairs, coin combinations) →
  **Dynamic Programming**, unless a closed form (binomial) is obvious.
- **Big numbers as digit lists or linked lists** (add two numbers, plus one) → math with
  carry, but the data-structure handling is the real test.

**Complexity:**
- Digit loops: O(number of digits) = O(log n). Euclid: O(log min(a, b)).
- Trial division: O(√n). Sieve: O(n log log n). Fast power: O(log n).

**Common pitfalls:**
- Negative numbers with `%` and `//` in Python (they round toward −∞).
- 32-bit overflow when the problem demands it. Python won't overflow for you, so check explicitly.
- `lcm = a * b // gcd`: in typed languages divide first, `a / gcd * b`, or it overflows.
- Off-by-one in the sieve (`p * p <= n` vs `< n`) and forgetting that 0 and 1 aren't prime.
- Floating point (`math.sqrt`, `**0.5`, `log`) for exact integer answers. Use `math.isqrt` or
  integer binary search.
