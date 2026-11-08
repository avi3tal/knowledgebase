"""Worked example: fan-out on write — every post is copied into each follower's timeline.

followers[a] lists the accounts that follow a. posts are "author:post_id"; opens are users
opening their feed. Returns [timeline writes, reads to serve every open, posts shown].
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def push_timelines(followers: dict[str, list[str]], posts: list[str], opens: list[str]) -> list[int]:
    timelines: dict[str, list[str]] = {}
    writes = 0
    for i in range(len(posts)):
        author, post = posts[i].split(":")
        for follower in followers[author]:
            if follower not in timelines:
                timelines[follower] = []
            timelines[follower].append(post)  # note: one write per follower — the cost is paid when posting
            writes += 1
    reads, shown = 0, 0
    for j in range(len(opens)):
        user = opens[j]
        feed = timelines.get(user, [])  # note: opening the feed is a single read of a ready-made list
        reads += 1
        shown += len(feed)
    return [writes, reads, shown]
