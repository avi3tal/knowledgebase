"""Worked example: roll a stream of click events into per-minute buckets on ingest.

events are [second, ad_id]. Each event increments the counter of its tumbling one-minute
window. The dashboard query "clicks for ad X per minute" then reads one row per minute
instead of every raw event. Returns [raw_events, bucket_rows, rows_read_for_query].
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def tumbling_windows(events: list[list], query_ad: str) -> list[int]:
    buckets: dict[str, int] = {}
    for i in range(len(events)):
        second, ad = events[i][0], events[i][1]
        minute = second // 60  # note: tumbling window — each second belongs to exactly one minute
        key = ad + "@" + str(minute)
        if key not in buckets:
            buckets[key] = 0  # note: first event of this (ad, minute): open a new bucket row
        buckets[key] += 1  # note: the raw event is folded into a counter
    rows_read = 0
    series: list[int] = []
    for key in buckets:
        ad = key.split("@")[0]
        if ad == query_ad:
            rows_read += 1
            series.append(buckets[key])  # note: the dashboard reads summaries, never raw clicks
    return [len(events), len(buckets), rows_read]
