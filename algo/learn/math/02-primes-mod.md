## Primes

- **Is n prime?** Trial division by 2..√n is O(√n). A divisor above √n pairs with one below it.
- **All primes up to n → Sieve of Eratosthenes.** Start with everything marked prime; for each
  prime p (only up to √n), cross out p², p² + p, p² + 2p, … Smaller multiples were already crossed
  out by smaller primes. Time **O(n log log n)**, space O(n).

```python
is_prime = [True] * n
is_prime[0:2] = [False, False]
for p in range(2, isqrt(n - 1) + 1):
    if is_prime[p]:
        for multiple in range(p * p, n, p):
            is_prime[multiple] = False
```

The animation counts the primes below 30. Watch how few crossings each prime needs once it starts
at p².

## Modular arithmetic
- "Return the answer modulo 10⁹ + 7" means the true answer is astronomically large. Reduce
  **after every** `+` and `*`: `(a * b) % M`, `(a + b) % M`. For subtraction use
  `(a - b) % M` (Python) or `((a - b) % M + M) % M` (others).
- **Fast power** `x^n mod M`: square-and-multiply over the bits of n, O(log n). Python has it
  built in: `pow(x, n, M)`.
- **Division mod a prime:** multiply by the modular inverse `pow(b, M - 2, M)` (Fermat).

## Counting and closed forms
- `1 + 2 + … + n = n(n+1)/2`. The missing number in 0..n is `n(n+1)/2 − sum(nums)`.
- Combinations `C(n, k)`: Pascal's rule `C(n, k) = C(n−1, k−1) + C(n−1, k)`, or factorials with
  modular inverses for many queries.
- Grid paths with only right/down moves: `C(m + n − 2, m − 1)`.
- **Contribution counting:** instead of enumerating all O(n²) subarrays, ask how many of them
  each element belongs to (index i is in `(i + 1) · (n − i)` of them) and sum the contributions.

## Algebra tricks on arrays
- **Expand absolute values.** `|a| = max(a, −a)`, so a sum of absolute values is the max over all
  sign choices. For the largest Manhattan distance between two points,
  `|x₁ − x₂| + |y₁ − y₂| = max over signs of (±x₁ ± y₁) − (±x₂ ± y₂)`. Per sign pattern you only
  need the max and min of one transformed value per point: O(n) instead of all O(n²) pairs.
- **Integer square root / k-th root:** binary search on the answer (or Newton's method). Avoid
  floating point when exactness matters.
