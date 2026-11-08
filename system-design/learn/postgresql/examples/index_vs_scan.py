"""Worked example: finding one row by key with a sequential scan vs a sorted (B-tree-like) index.

pages is the heap: each inner list is one page of row keys, in insertion order.
index is a list of [key, page] pairs sorted by key. Returns [pages_read, probes, page_found]:
heap pages the scan had to read, index entries the search touched, and the page holding the key.
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def index_vs_scan(pages: list[list[int]], index: list[list[int]], target: int) -> list[int]:
    pages_read = 0
    page_found = -1
    for p in range(len(pages)):
        pages_read += 1  # note: sequential scan — every heap page is read, there is no order to exploit
        for r in range(len(pages[p])):
            if pages[p][r] == target:
                page_found = p  # note: found it, but keys aren't unique, so the scan still reads the rest
    probes = 0
    lo = 0
    hi = len(index) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        probes += 1  # note: index probe — keys are sorted, so each probe halves the range
        if index[mid][0] == target:
            page_found = index[mid][1]  # note: the index entry points straight at the heap page to read
            break
        if index[mid][0] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return [pages_read, probes, page_found]
