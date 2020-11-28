"""
Merge Two Sorted Lists II
Given two sorted integer arrays A and B, merge B into A as one sorted array.
"""


class Solution:
    # @param A : list of integers
    # @param B : list of integers
    def merge(self, A, B):
        i = j = 0
        while i < len(A) and j < len(B):
            if A[i] > B[j]:
                A.insert(i, B[j])
                j += 1
            i += 1

        A.extend(b[j:])



a = [1, 5, 8, 10]
b = [6, 9]

s = Solution()
s.merge(a, b)

print(a)