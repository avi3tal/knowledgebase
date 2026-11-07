"""Worked example: consistent hashing on a ring of positions 0..99; add one node and see what moves.

Node and key positions are their hash values mod 100, given directly so the demo is readable.
Reference code for the lesson animation; `# note:` comments become the narration.
"""

from bisect import bisect_left


def ring_remap(nodes: dict[str, int], key_pos: dict[str, int], new_node: str, new_pos: int) -> list[str]:
    ring = sorted(nodes.values())  # note: the ring — node positions sorted clockwise
    at = {pos: name for name, pos in nodes.items()}
    owner: dict[str, str] = {}
    for key in key_pos:
        idx = bisect_left(ring, key_pos[key]) % len(
            ring
        )  # note: walk clockwise to the first node at or after the key (wrap past 99 to the start)
        owner[key] = at[ring[idx]]
    ring.insert(bisect_left(ring, new_pos), new_pos)  # note: a new node joins the ring at its own position
    at[new_pos] = new_node
    moved: list[str] = []
    for key in key_pos:
        idx = bisect_left(ring, key_pos[key]) % len(ring)
        new_owner = at[ring[idx]]
        if new_owner != owner[key]:
            moved.append(key)  # note: only keys between the new node and its predecessor move — all to the new node
            owner[key] = new_owner
    return moved
