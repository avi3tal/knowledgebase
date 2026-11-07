"""Worked example (trie with counts): for every word, the sum of the scores of all its prefixes.

The score of a prefix = how many words in the list start with it.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def prefix_scores(words: list[str]) -> list[int]:
    root: dict = {}
    for word in words:
        node = root
        for ch in word:
            node = node.setdefault(ch, {"#": 0})  # note: step into the child for ch, creating it if missing
            node["#"] += 1  # note: one more word passes through this prefix
    scores = []
    for word in words:
        node, score = root, 0
        for ch in word:
            node = node[ch]
            score += node["#"]  # note: query: add how many words share this prefix
        scores.append(score)  # note: every prefix of the word has been scored
    return scores
