"""
Given a list of non negative integers, arrange them such that they form the largest number.

For example:
Given [3, 30, 34, 5, 9], the largest formed number is 9534330.

Note: The result may be very large, so you need to return a string instead of an integer.

3034
3430
"""


class Solution:
    def concat_ints(self, x, y):
        digits = len(str(y))
        x = x * (10**digits)
        return x + y

    def is_larger(self, x, y):
        if x < 10 and y < 10:
            return x > y

        x_concat = self.concat_ints(x, y)
        y_concat = self.concat_ints(y, x)

        return x_concat > y_concat

    def sort(self, A):
        if len(A) > 1:
            mid = len(A) // 2

            L = A[:mid]
            R = A[mid:]
            self.sort(L)
            self.sort(R)

            i = j = k = 0

            while i < len(L) and j < len(R):
                if self.is_larger(L[i], R[j]):
                    A[k] = L[i]
                    i += 1
                else:
                    A[k] = R[j]
                    j += 1
                k += 1

            while i < len(L):
                A[k] = L[i]
                i += 1
                k += 1

            while j < len(R):
                A[k] = R[j]
                j += 1
                k += 1

    # @param A : tuple of integers
    # @return a strings
    def largestNumber(self, A):
        if sum(A) == 0:
            return "0"
        self.sort(A)
        return "".join(map(str, A))





s = Solution()
a = [3, 30, 34, 5, 9]
print(s.largestNumber(a))

a = [8, 89]
print(s.largestNumber(a))


a = [989]
print(s.largestNumber(a))