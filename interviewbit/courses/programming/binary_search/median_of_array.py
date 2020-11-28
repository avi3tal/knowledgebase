"""
There are two sorted arrays A and B of size m and n respectively.
Find the median of the two sorted arrays ( The median of the array formed by merging both the arrays ).
The overall run time complexity should be O(log (m+n)).

Example:
input
A : [1 4 5]
B : [2 3]

output
3
"""


def findMedianSortedArrays(A, B):
    """
    O(n)
    """
    i = j = k = 0
    arr = []
    while i < len(A) and j < len(B):
        if A[i] < B[j]:
            arr.append(A[i])
            i += 1
        else:
            arr.append(B[j])
            j += 1
        k += 1

    while i < len(A):
        arr.append(A[i])
        i += 1
        k += 1

    while j < len(B):
        arr.append(B[j])
        j += 1
        k += 1

    mid = k // 2
    if k & 1:  # Odd
        return arr[mid]
    return (arr[mid] + arr[mid - 1]) / 2.0


A = [1, 4, 5]
B = [2, 3]
# 1 2 3 4 5 6
print(findMedianSortedArrays(A, B))
