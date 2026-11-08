"""Worked example: hybrid fan-out — push for normal accounts, pull for big ones.

An author with more than `threshold` followers is not fanned out: the post is written once to the
author's own list and merged into each reader's feed when it is opened.
Returns [writes, reads, posts shown]. A huge threshold gives pure push; threshold 0 gives pure pull.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def hybrid_feed(followers: dict[str, list[str]], posts: list[str], opens: list[str], threshold: int) -> list[int]:
    timelines: dict[str, list[str]] = {}
    celeb_posts: dict[str, list[str]] = {}
    writes = 0
    for i in range(len(posts)):
        author, post = posts[i].split(":")
        if len(followers[author]) > threshold:
            if author not in celeb_posts:
                celeb_posts[author] = []
            celeb_posts[author].append(post)  # note: big account — one write to its own list, no fan-out
            writes += 1
            continue
        for follower in followers[author]:
            if follower not in timelines:
                timelines[follower] = []
            timelines[follower].append(post)  # note: normal account — push into each follower's timeline
            writes += 1
    reads, shown = 0, 0
    for j in range(len(opens)):
        user = opens[j]
        feed = list(timelines.get(user, []))
        reads += 1  # note: read the precomputed timeline first
        for celeb in celeb_posts:
            if user in followers[celeb]:
                feed.extend(celeb_posts[celeb])  # note: pull — merge the big account's recent posts at read time
                reads += 1
        feed.sort()
        shown += len(feed)  # note: same posts shown as with pure push — only the cost moved
    return [writes, reads, shown]
