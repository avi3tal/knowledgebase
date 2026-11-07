"""Worked example: two threads increment a shared counter; the schedule decides who runs next.

Each thread runs `read → write` (write = the value it read + 1). With `use_lock`, it must
acquire the lock first and release it after writing. The schedule string is replayed in a loop.
"""


def interleave(schedule: str, use_lock: bool) -> int:
    counter = 0
    lock_owner = "-"
    program = ["acquire", "read", "write", "release"] if use_lock else ["read", "write"]
    pc = {"A": 0, "B": 0}  # next instruction per thread
    seen = {"A": 0, "B": 0}  # each thread's private copy (a CPU register)
    tick = 0
    while any(pc[t] < len(program) for t in pc):
        thread = schedule[tick % len(schedule)]
        tick += 1
        if pc[thread] == len(program):
            continue
        step = program[pc[thread]]
        if step == "acquire":
            if lock_owner != "-":
                continue  # note: lock is held by the other thread — this thread blocks, makes no progress
            lock_owner = thread  # note: acquired — now only this thread can enter the critical section
        elif step == "read":
            seen[thread] = counter  # note: read shared counter into a private copy
        elif step == "write":
            counter = seen[thread] + 1  # note: write back private copy + 1 — overwrites whatever the other thread wrote
        else:
            lock_owner = "-"  # note: release — the other thread may now acquire
        pc[thread] += 1
    return counter
