# Strings

> Fundamental · Data structures: string (array of characters), count array / hash map

A string is an array of characters, so most array techniques apply directly: two pointers,
sliding windows, prefix sums, sorting. What makes string problems their own topic is a handful of
**string-specific facts and tools**.

## Facts that change your complexity

| Fact | Consequence |
|---|---|
| Strings are **immutable** in Python, Java, Go | `s += c` in a loop copies every time → O(n²). Collect parts in a list and `"".join(parts)` once. |
| Slicing `s[i:j]` **copies** | A slice inside a loop costs O(j − i) each time. Prefer indices. |
| Comparing / hashing a string is O(L) | A set of n strings of length L costs O(n·L) to build. Count L in your answer. |
| The alphabet is usually small (26) | Count arrays `[0] * 26` with `ord(c) - ord('a')` are O(1) space and fast. |

## The everyday toolbox

- **Character counts:** `Counter(s)` or a 26-slot array. Anagrams, "can I build X from Y",
  frequency questions.
- **Canonical key:** map every string to a form that equal-up-to-X strings share (sorted letters,
  the count tuple, the gaps between letters). Then group in a dict.
- **Two pointers:** palindromes (from both ends), subsequence checks (one pointer per string),
  in-place reversal.
- **Build, don't concatenate:** a list of parts plus one `join`.
- **Parse with an index:** walk `i` through the string, consume a run (digits, spaces, a repeated
  character), act on it, repeat. This covers atoi, run-length encoding, look-and-say, and
  decoding.

## Template: counting characters

```python
counts = {}
for ch in source:
    counts[ch] = counts.get(ch, 0) + 1     # what is available
for ch in target:
    if counts.get(ch, 0) == 0:
        return False                       # need one more than we have
    counts[ch] -= 1                        # use it up
return True
```

Below: can the `note` be written using letters cut out of `magazine` (each letter once)? Watch
the map fill up, then drain.
