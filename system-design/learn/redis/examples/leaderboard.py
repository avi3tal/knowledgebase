"""Worked example: a game leaderboard kept in a Redis sorted set (ZINCRBY + ZREVRANGE).

events are "<player>+<points>". The sorted set is modelled as a score map plus a ranking list
kept in score order (Redis uses a skip list, so each update is O(log n)). Equal scores keep
the earlier member first. Returns the top k players.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def leaderboard(events: list[str], k: int) -> list[str]:
    scores: dict[str, int] = {}
    ranking: list[str] = []  # highest score first
    for i in range(len(events)):
        player, points = events[i].split("+")
        old = scores.get(player, 0)
        scores[player] = old + int(points)  # note: ZINCRBY board <points> <player>, atomic in the server
        if player in ranking:
            ranking.remove(player)  # note: the member leaves its old position...
        j = 0
        while j < len(ranking) and scores[ranking[j]] >= scores[player]:
            j += 1
        ranking.insert(j, player)  # note: ...and is re-linked at its new rank, so the set is always sorted
    top = ranking[:k]  # note: ZREVRANGE board 0 k-1: the top k come straight off the front, no sort at read time
    return top
