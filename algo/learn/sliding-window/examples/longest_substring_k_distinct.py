"""Worked example (dynamic window): longest substring with at most k distinct characters.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def longest_k_distinct(s: str, k: int) -> int:
    counts: dict[str, int] = {}
    window_start, best = 0, 0
    for window_end in range(len(s)):
        right = s[window_end]
        counts[right] = counts.get(right, 0) + 1  # note: expand — count the character entering
        while len(counts) > k:
            left = s[window_start]  # note: too many distinct characters — shrink from the left
            counts[left] -= 1
            if counts[left] == 0:
                del counts[left]  # note: character fully left the window — drop it from the map
            window_start += 1
        best = max(best, window_end - window_start + 1)  # note: window is valid — update the best length
    return best
