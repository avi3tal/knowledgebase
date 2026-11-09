## Substring search (string matching)

Find pattern `p` (length m) inside text `t` (length n).

| Method | Time | Idea |
|---|---|---|
| Brute force | O(n · m) worst | try every start, compare char by char. Fine for small inputs, and it's what most interviews accept for "easy" |
| **Rabin-Karp** | O(n + m) expected | rolling hash of each length-m window; compare characters only when hashes match |
| **KMP** | O(n + m) worst | never re-read the text; on a mismatch, fall back using the **prefix function** |
| Built-ins (`in`, `find`, `strings.Index`) | fast in practice | say what they do and their worst case if you use them |

### The prefix function (KMP's failure table)

`lps[i]` = length of the longest proper prefix of `s[0..i]` that is also a suffix of it.

```figure
lps-table
```

It is built in O(n) with two indices. `i` scans forward, and `k` is the length of the current
matched prefix. On a mismatch, `k` falls back to `lps[k − 1]` (the next shorter prefix that is
also a suffix) instead of restarting from 0:

```python
lps, k = [0] * len(s), 0
for i in range(1, len(s)):
    while k > 0 and s[i] != s[k]:
        k = lps[k - 1]        # fall back to a shorter border
    if s[i] == s[k]:
        k += 1
    lps[i] = k
```

To **search**, run the same loop over `p + "#" + t` and report every position where `k == m`.
Other uses: the shortest period of a string is `n − lps[n−1]`, so a string is a repeated block
exactly when that period divides n. The animation checks exactly that.

### Rolling hash in one line
`h(window starting at i+1) = (h(i) − t[i] · B^(m−1)) · B + t[i+m]`, all mod a large prime. It's
O(1) per shift. Good for "find repeated substrings of length L" (e.g. repeated DNA sequences).

## Simulation and parsing
Many "string" problems are careful step-by-step simulations: look-and-say, atoi, zigzag
conversion, compress runs, decode `3[a2[c]]` (with a stack). The algorithm is easy; the edge
cases (empty input, signs, overflow, multiple spaces, a final run you forgot to flush) are the test.
