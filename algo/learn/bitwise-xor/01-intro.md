# Bitwise XOR

> Pattern #13 · Data structures: integers as bit vectors, arrays

Some problems hide a pairing: every number appears twice except one, the numbers `0..n` with
one gap, two strings that differ by a single letter. The obvious tool is a hash set or a counter,
which costs O(n) extra space. Or you sort, which costs O(n log n). XOR does it in **O(n) time and
O(1) space**, because it can make pairs **cancel out**.

**XOR (`^`) compares bits column by column:** the result bit is 1 when the two input bits
**differ**.

```figure
xor-columns
```

**The four rules that make the pattern work:**

| rule | meaning |
|---|---|
| `x ^ x = 0` | a value cancels itself |
| `x ^ 0 = x` | 0 is the neutral start |
| `a ^ b = b ^ a`, `(a ^ b) ^ c = a ^ (b ^ c)` | order and grouping don't matter |
| `a ^ b = c` ⇔ `a ^ c = b` | XOR is its own inverse, so you can "un-XOR" |

Put together: XOR a whole list, and **every value that appears an even number of times
vanishes**, wherever its copies sit. What's left is the XOR of the values that appear an odd
number of times.

```text
5 ^ 3 ^ 6 ^ 9 ^ 6 ^ 3 ^ 5
= (5 ^ 5) ^ (3 ^ 3) ^ (6 ^ 6) ^ 9      reorder freely
=    0    ^    0    ^    0    ^ 9  =  9
```

## The template: fold the list with XOR

```python
acc = 0
for x in nums:
    acc ^= x          # pairs cancel, wherever they are
return acc            # the XOR of everything that appeared an odd number of times
```

- One pass and one integer. Nothing is sorted, counted or stored.
- **Sum would also cancel pairs** if you knew the expected total, but sums can overflow in
  fixed-width languages. XOR never leaves the bit width of its inputs.

## Missing value: XOR the expected with the actual

When the array should contain `0..n` but one is missing, XOR the **indices** and the
**values** together. Every present number appears twice (once as an index or `n`, once as a
value) and cancels. The missing one appears only once, so it's all that survives the fold.

Step through the single-number fold below on `[5, 3, 6, 9, 6, 3, 5]`. Watch the `binary` map: a
column flips each time a value with a 1 in that column arrives, and flips back when its twin
arrives.
