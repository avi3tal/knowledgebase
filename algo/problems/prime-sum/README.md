# Prime Sum (Goldbach pair)

> Difficulty: **medium** · Patterns: math · Sources: [interviewbit](https://www.interviewbit.com/problems/prime-sum/)

## Problem
Given an even number `n > 2`, return two primes `[p, q]` with `p + q = n`. If several pairs exist,
return the lexicographically smallest one (smallest `p`). A solution always exists for the given
range (Goldbach's conjecture, verified far beyond it).

## Examples
- `n = 4` → `[2, 2]`
- `n = 10` → `[3, 7]` (`[5, 5]` is valid too, but `3 < 5`)
- `n = 98` → `[19, 79]`

## Constraints
- `4 <= n <= 2 * 10^7`, `n` even.
- Trial division up to `n` for every candidate is too slow; test up to `sqrt` or use a sieve.

## Pattern & how to recognise it
- "Many primality checks on numbers up to N" → **Sieve of Eratosthenes** once, then O(1)
  lookups. Scan `p` upward from 2 and stop at the first `p` with `p` and `n - p` both prime.
- For a single check, **trial division only up to √x** is enough: a composite `x` has a divisor
  `<= √x`.

## Learning material
- **Sieve:** boolean array `is_prime[0..n]`; for each `i` from 2 while `i * i <= n`, if prime,
  mark `i*i, i*i + i, …` composite. Time O(n log log n), space O(n).
- **Trial division:** O(√x) per test; skip even divisors after 2.
- Goldbach pairs are found with a very small `p` in practice, so scanning from `p = 2` stops early.
- Sieve of Eratosthenes: https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html

## Hints
<details><summary>Hint 1</summary>

To get the lexicographically smallest pair, in which order should you try `p`?
</details>
<details><summary>Hint 2</summary>

How far do you really need to search for a divisor of `x`? Or precompute all primes up to `n`.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Sieve up to `n`; for `p` from 2 to `n / 2`: if `is_prime[p] and is_prime[n - p]` return
`[p, n - p]`. Time O(n log log n), space O(n). With √-trial division and no sieve:
O(k·√n) where `k` is how far the scan goes (tiny in practice), space O(1).
</details>

## Follow-ups
- Count all Goldbach pairs of `n`.
- Primes in a range `[L, R]` with `R` up to 10^12 (segmented sieve).
