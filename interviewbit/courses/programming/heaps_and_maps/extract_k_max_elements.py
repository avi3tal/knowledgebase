from heapq import heapify, heappush, heappop



def extract_k_max(lst, k):
    heap = lst[:k]
    heapify(heap)

    for i in lst[k:]:
        if i > heap[0]:
            heappop(heap)
            heappush(heap, i)
    return heap


print(extract_k_max([2, 5, 11, 3, 0, 20, 9, 98, 1, 99, 14, 100], 4))