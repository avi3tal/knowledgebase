"""Worked example: a bounded buffer (producer/consumer), simulated one operation at a time.

Real threads are not deterministic, so the script decides the interleaving. `blocked_puts` and
`blocked_takes` play the role of threads sleeping on the `not_full` / `not_empty` conditions.
"""


def simulate_bounded_buffer(capacity: int, script: list[str]) -> list[str]:
    buf: list[str] = ["_"] * capacity
    head = tail = count = 0
    blocked_puts: list[str] = []
    blocked_takes = 0
    log: list[str] = []

    def store(item: str) -> None:
        nonlocal tail, count
        buf[tail] = item  # note: write at tail, then advance it around the ring
        tail = (tail + 1) % capacity
        count += 1

    def remove() -> str:
        nonlocal head, count
        item = buf[head]
        buf[head] = "_"  # note: read at head, free the slot, advance head around the ring
        head = (head + 1) % capacity
        count -= 1
        return item

    for op in script:
        if op.startswith("put:"):
            item = op[4:]
            if count == capacity:
                blocked_puts.append(item)  # note: buffer full → the producer waits on not_full
                log.append(f"wait put {item}")
                continue
            store(item)
            log.append(f"put {item}")
            if blocked_takes:
                blocked_takes -= 1  # note: notify(not_empty) — a sleeping consumer wakes and takes it
                log.append(f"woken take {remove()}")
        else:
            if count == 0:
                blocked_takes += 1  # note: buffer empty → the consumer waits on not_empty
                log.append("wait take")
                continue
            log.append(f"take {remove()}")
            if blocked_puts:
                item = blocked_puts.pop(0)  # note: notify(not_full) — the first sleeping producer wakes and stores
                store(item)
                log.append(f"woken put {item}")
    return log
