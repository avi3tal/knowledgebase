"""Worked example (bitmasks as letter sets): the largest len(a) * len(b) over pairs of words
that share no letter.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def max_word_product(words: list[str]) -> int:
    masks = []
    for word in words:
        mask = 0
        for ch in word:
            mask |= 1 << (ord(ch) - ord("a"))  # note: set the bit for this letter (a = bit 0, b = bit 1, …)
        masks.append(mask)  # note: one integer now stands for the word's whole letter set
    best = 0
    for i in range(len(words)):
        for j in range(i + 1, len(words)):
            shared = masks[i] & masks[j]  # note: AND keeps only the letters both words contain
            if shared == 0:
                best = max(best, len(words[i]) * len(words[j]))  # note: disjoint letter sets — candidate pair
    return best
