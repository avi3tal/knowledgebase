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

    def incrementVector(self, A):
        start = 0
        for i in A:
            if not i:
                start += 1
            else:
                break
        A = A[start:]
        n = len(A)

        A[n-1] += 1
        carry = A[n-1] / 10
        A[n - 1] = A[n-1] % 10

        for i in range(n-2, -1, -1):
            if carry == 1:
                A[i] += 1
                carry = A[i] / 10
                A[i] %= 10

        if carry == 1:
            A.insert(0, 1)

        return A



s = Solution()
print(s.plusOne([0]))

print(s.incrementVector([9, 9, 9, 9]))
print(s.incrementVector([0, 3, 7, 6, 4, 0, 5, 5, 5 ]))
print(s.incrementVector([0, 0, 0, 0, 5, 5, 5 ]))
