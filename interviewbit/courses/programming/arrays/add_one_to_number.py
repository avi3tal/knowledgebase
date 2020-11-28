"""
Given a non-negative number represented as an array of digits,
add 1 to the number ( increment the number represented by the digits ).
The digits are stored such that the most significant digit is at the head of the list.

Example:
If the vector has [1, 2, 3]
the returned vector should be [1, 2, 4]
as 123 + 1 = 124.
"""

class Solution:
    # @param A : list of integers
    # @return a list of integers
    def plusOne(self, A):
        if len(A) > 1 and not A[0]:
            return self.plusOne(A[1:])
        if len(A) == 1 and A[0] == 9:
            return [1, 0]
        if A[-1] < 9:
            A[-1] += 1
            return A
        else:
            return self.plusOne(A[:-1]) + [0]



s = Solution()
print(s.plusOne([0]))
