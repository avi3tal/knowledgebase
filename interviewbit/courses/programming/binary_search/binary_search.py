def binary_search(arr, target):
    n = len(arr)
    start, end = 0, n-1

    while start <= end:
        mid = (start + end) // 2
        # print(start, end, mid)
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            start = mid + 1
        else:
            end = mid - 1
    return None


arr = [2, 4, 5, 6, 7, 8, 10, 13, 20, 21]

print(binary_search(arr, 6))
