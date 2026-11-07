"""Worked example (KMP prefix function): is `s` some block repeated two or more times?

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def is_repeated_block(s: str) -> bool:
    n = len(s)
    if n == 0:
        return False
    lps = [0] * n  # note: lps[i] = longest proper prefix of s[:i+1] that is also its suffix
    k = 0
    for i in range(1, n):
        while k > 0 and s[i] != s[k]:
            k = lps[k - 1]  # note: mismatch — fall back to the next shorter prefix that is also a suffix
        if s[i] == s[k]:
            k += 1  # note: the matched prefix grows by one
        lps[i] = k
    period = n - lps[-1]  # note: shortest period = n minus the longest border
    return lps[-1] > 0 and n % period == 0  # note: repeated iff that period tiles s exactly
