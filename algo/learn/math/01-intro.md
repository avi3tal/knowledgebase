# Math & Number Theory

> Fundamental · Tools: digit arithmetic, overflow checks, gcd / lcm, primes, modular arithmetic

Math questions in interviews are rarely deep mathematics. They test whether you can turn a
number fact into a short, correct loop, and whether you handle the **edge cases**: zero,
negatives, overflow, and huge inputs that need a formula instead of a simulation.

## Digits without strings

```python
while n > 0:
    digit = n % 10        # the last digit
    n //= 10              # drop it
    rev = rev * 10 + digit  # append a digit to another number
```

- Reversing a number, checking a palindrome, summing digits, or base conversion
  (`% b`, `// b`) all use this loop. Number of digits = O(log₁₀ n).
- **Python's `//` and `%` round toward −∞:** `-7 // 10 == -1` and `-7 % 10 == 3`. Work with
  `abs(n)` and reapply the sign, or you'll get surprises. Go/Java/C truncate toward 0.
- **Overflow:** Python ints never overflow, so if the problem says "32-bit", check it yourself:
  `-2**31 <= x <= 2**31 - 1`. In typed languages, check **before** you multiply:
  `rev > (MAX - digit) / 10`.

## Greatest common divisor: Euclid

`gcd(a, b) = gcd(b, a mod b)`, and `gcd(a, 0) = a`. Each step at least halves the larger number
every two iterations, so it's **O(log min(a, b))**.

```python
while b:
    a, b = b, a % b
return a                  # lcm(a, b) = a // gcd(a, b) * b   (divide first to stay small)
```

Uses: simplify fractions, check if a slope is the same (normalise by gcd), lcm of periods
("when do the two cycles line up?"), "can amounts x and y measure z?" (z must be a multiple of
gcd(x, y)).

Below: gcd(144, 89). Consecutive Fibonacci numbers are Euclid's **worst case** (every quotient
is 1), and it still takes only about 10 steps. Watch each remainder become the next divisor.
