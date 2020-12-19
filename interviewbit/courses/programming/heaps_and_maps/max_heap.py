from heapq import heappop, heappush


class MaxHeapObj:
    def __init__(self, val):
        self.val = val

    def __lt__(self, other):
        return self.val > other.val

    def __eq__(self, other):
        return self.val == other.val

    def __str__(self):
        return str(self.val)


class MaxHeap:
    def __init__(self):
        self.data = []

    def top(self):
        return self.data[0]

    def push(self, val):
        heappush(self.data, MaxHeapObj(val))

    def pop(self):
        return heappop(self.data)


def extract_k_min_elements(lst, k):
    heap = MaxHeap()
    for i in lst[:k]:
        heap.push(i)
    for i in lst[k:]:
        if heap.top().val > i:
            heap.pop()
            heap.push(i)

    return [i.val for i in heap.data]


print(extract_k_min_elements([2, 5, 11, 3, 0, 20, 9, 98, 1, 99, 14, 100], 3))
