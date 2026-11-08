"""Worked example: a virtual waiting room in front of a service that admits `admit` users per tick.

Arriving users get a place in a FIFO line and an ETA (position // admit ticks). Each tick the
head of the line receives an admission token and enters the protected service. If the line is
already `room_size` long, the newcomer is turned away with "try later".
Returns the admitted users in order, how many were turned away, and each user's first ETA.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def waiting_room(arrivals: list[int], admit: int, room_size: int) -> dict[str, object]:
    line: list[str] = []
    eta: dict[str, int] = {}
    admitted: list[str] = []
    turned_away, next_id, tick = 0, 1, 0
    while tick < len(arrivals) or line:
        incoming = arrivals[tick] if tick < len(arrivals) else 0
        for _ in range(incoming):
            user = "u" + str(next_id)
            next_id += 1
            if len(line) >= room_size:
                turned_away += 1  # note: the line is bounded too — beyond it, "try later"
                continue
            line.append(user)
            eta[user] = (len(line) - 1) // admit  # note: tell users their wait up front
        for _ in range(min(admit, len(line))):
            admitted.append(line.pop(0))  # note: token issued — the core sees a steady rate
        tick += 1
    return {"admitted": admitted, "turned_away": turned_away, "eta": eta}
