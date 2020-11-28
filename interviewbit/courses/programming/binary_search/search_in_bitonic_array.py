"""
Given a bitonic sequence A of N distinct elements, write a program to find a given element B in the bitonic sequence in O(logN) time.
NOTE: A Bitonic Sequence is a sequence of numbers which is first strictly increasing then after a point strictly decreasing.

Example:
A = [3, 9, 10, 20, 17, 5, 1]
B = 20

= 3

"""


def find_max(A):
    start, end = 0, len(A) -1
    while start <= end:
        mid = (start + end) // 2
        if A[mid -1] < A[mid] > A[mid + 1]:
            return mid
        if A[mid -1] < A[mid]:
            start = mid + 1
        else:
            end = mid - 1
    return -1


def _ascending_solve(A, start, end, B):
    while start <= end:
        mid = (start + end) // 2
        print("as", mid, start, end)
        if A[mid] == B:
            return mid

        if A[mid] < B:
            start = mid + 1
        else:
            end = mid - 1
    return -1


def _descending_solve(A, start, end, B):
    """
    :param A: array
    :param D: direction 1 up and -1 down
    """
    while start <= end:
        mid = (start + end) // 2
        print("de", mid, start, end)
        if A[mid] == B:
            return mid

        if A[mid] < B:
            end = mid - 1
        else:
            start = mid + 1

    return -1


def solve(A, B):
    max_point = find_max(A)
    return _ascending_solve(A, 0, max_point, B) + _descending_solve(A, max_point, len(A)-1, B) + 1


A = [ 1, 20, 50, 40, 10 ]
B = 5
# print(find_max(A))
print(solve(A, B))
