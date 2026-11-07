"""Worked example: at-least-once processing with retries and a dead-letter queue (DLQ).

fails[m] says how many times handling message m fails before it succeeds (a "poison" message
fails every time). After max_attempts failures the message goes to the DLQ.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def retry_dlq(messages: list[str], fails: dict[str, int], max_attempts: int) -> dict[str, list[str]]:
    queue = list(messages)
    attempts: dict[str, int] = {}
    done: list[str] = []
    dlq: list[str] = []
    while queue:
        msg = queue.pop(0)  # note: deliver the next message; it is not acknowledged yet
        attempts[msg] = attempts.get(msg, 0) + 1
        if attempts[msg] > fails.get(msg, 0):
            done.append(msg)  # note: handler succeeded — ack, and the broker deletes the message
        elif attempts[msg] >= max_attempts:
            dlq.append(msg)  # note: still failing after max attempts — park it in the DLQ so it stops blocking others
        else:
            queue.append(msg)  # note: handler failed — no ack, so the message is redelivered later (at-least-once)
    return {"done": done, "dlq": dlq}
