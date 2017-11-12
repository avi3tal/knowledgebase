"""
https://www.programiz.com/dsa/heap-sort

Procedures to follow for Heapsort
---------------------------------
Since the tree satisfies **Max-Heap** property, then the largest item is stored at the root node.
Remove the root element and put at the end of the array (nth position) Put the last item of the tree (heap) at the vacant place.
Reduce the size of the heap by 1 and heapify the root element again so that we have highest element at root.
The process is repeated until all the items of the list is sorted.

Performance
-----------
Heap Sort has O(n log n) time complexities for all the cases ( best case, average case and worst case).
"""

from ds.heap.heap import heapify, max_heap


def heap_sort(arr):
    n = len(arr)

    # First we build max-heap
    max_heap(arr)

    # then we start swapping between first and last elements and decrease array by one
    for i in range(n-1, 0, -1):
        # swap first element with last element
        arr[i], arr[0] = arr[0], arr[i]

        # heapify but with new len each time (decreased by one) and root node 0
        heapify(arr, i, 0)


if __name__ == "__main__":
    # array = [12, 11, 13, 5, 6, 7]
    array = [1, 12, 9, 5, 6, 10]
    heap_sort(array)
    n = len(array)
    print ("Sorted array is {}".format(array))
