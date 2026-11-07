"""Reference functions for the new-views contract fixture (shared by pytest and vitest)."""

import heapq


def max_depth(root):
    best = 0

    def dfs(node, depth):
        nonlocal best
        if node is None:
            return
        best = max(best, depth)  # note: visit node
        dfs(node.left, depth + 1)
        dfs(node.right, depth + 1)

    dfs(root, 1)
    return best


def lcs_length(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1  # note: match
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[len(a)][len(b)]


def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)  # note: push
        if len(heap) > k:
            heapq.heappop(heap)  # note: evict smallest
    return heap[0]


def merge(intervals):
    intervals = sorted(intervals)
    merged = []
    for i in range(len(intervals)):
        start, end = intervals[i]
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)  # note: overlap — extend
        else:
            merged.append([start, end])  # note: new interval
    return merged
