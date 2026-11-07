"""Naive recursion: O(2^n) on purpose."""

from __future__ import annotations


def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)
