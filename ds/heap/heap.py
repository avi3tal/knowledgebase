def heapify(arr, n, i):
    """
    :param arr: entire array
    :param n: len of array
    :param i: index (parent) node
    """

    largest = i
    l = i * 2 + 1
    r = i * 2 + 2

    # print("arr -> {}".format(arr))
    # print("left={} right={} largest={}".format(l, r, largest))

    if l < n and arr[l] > arr[largest]:
        largest = l

    if r < n and arr[r] > arr[largest]:
        largest = r

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        # print("after swap -> {}".format(arr))

        heapify(arr, n, largest)


def max_heap(arr):
    n = len(arr)

    # to figure out what would be the first parent node in array we run "n/2 - 1"
    i = n / 2 - 1
    while i >= 0:
        heapify(arr, n, i)
        i -= 1

    print("max_heap={}".format(arr))


if __name__ == "__main__":
    array = [1, 12, 9, 5, 6, 10]
    max_heap(array)
    print("-"*len(array)*5)
    print("Final max_heap array:")
    print(array)
