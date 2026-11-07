"""Worked example (Sieve of Eratosthenes): how many primes are strictly below n?

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def count_primes(n: int) -> int:
    if n < 3:
        return 0
    is_prime = [True] * n
    is_prime[0] = is_prime[1] = False  # note: 0 and 1 are not prime
    p = 2
    while p * p < n:  # note: primes above sqrt(n) have no multiples left to cross out
        if is_prime[p]:
            for multiple in range(p * p, n, p):
                is_prime[multiple] = (
                    False  # note: cross out multiples starting at p*p — smaller ones were done by smaller primes
                )
        p += 1
    return sum(is_prime)  # note: whatever survived is prime
