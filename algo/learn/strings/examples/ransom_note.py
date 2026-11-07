"""Worked example (character counts): can `note` be written with the letters of `magazine`?

Each magazine letter can be used once.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def can_construct(note: str, magazine: str) -> bool:
    counts: dict[str, int] = {}
    for ch in magazine:
        counts[ch] = counts.get(ch, 0) + 1  # note: count the supply of each letter
    for ch in note:
        if counts.get(ch, 0) == 0:
            return False  # note: we need this letter but none are left
        counts[ch] -= 1  # note: use one copy of the letter
    return True  # note: every letter of the note was covered
