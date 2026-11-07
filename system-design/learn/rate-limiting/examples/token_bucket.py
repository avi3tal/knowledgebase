"""Worked example: token bucket rate limiter over a timeline of request timestamps (seconds).

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def token_bucket(times: list[int], capacity: int, refill_per_sec: int) -> list[str]:
    tokens = capacity  # note: start full, so a fresh client may burst up to `capacity` requests
    last = times[0] if times else 0
    decisions: list[str] = []
    for i in range(len(times)):
        now = times[i]
        tokens = min(
            capacity, tokens + (now - last) * refill_per_sec
        )  # note: lazy refill — add tokens for the time since the last request, capped at capacity
        last = now
        if tokens >= 1:
            tokens -= 1  # note: a token is available — spend it and let the request through
            decisions.append("allow")
        else:
            decisions.append("reject")  # note: bucket empty — reject (HTTP 429) until it refills
    return decisions
