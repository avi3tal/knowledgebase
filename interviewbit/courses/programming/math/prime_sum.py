"""
Given an even number ( greater than 2 ), return two prime numbers whose sum will be equal to given number.
NOTE A solution will always exist. read Goldbach’s conjecture

Example:
Input : 4
Output: 2 + 2 = 4
"""


class Solution:
    def isprime(self, n):
        res = False
        if n > 1:
            if n == 2:
                res = True
            elif n & 1:
                for i in range(2, n):
                    if n % i == 0:
                        break
                else:
                    res = True
        return res

    # @param A : integer
    # @return a list of integers
    def primesum(self, A):
        for i in range(A):
            if self.isprime(i):
                tmp = A - i
                if self.isprime(tmp):
                    return f"{i} + {tmp} = {A}"



s = Solution()
print(s.primesum(10))
