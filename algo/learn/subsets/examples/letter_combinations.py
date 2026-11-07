"""Worked example (BFS subsets, k choices per position): letter combinations of a phone number.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

KEYPAD = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}


def letter_combinations(digits: str) -> list[str]:
    if not digits:
        return []
    combos = [""]  # note: level 0 — one empty prefix
    for digit in digits:
        letters = KEYPAD[digit]  # note: next digit — every prefix branches once per letter
        next_level = []
        for prefix in combos:
            for letter in letters:
                next_level.append(prefix + letter)  # note: clone the prefix and extend it with one letter
        combos = next_level  # note: the new level replaces the old one
    return combos
