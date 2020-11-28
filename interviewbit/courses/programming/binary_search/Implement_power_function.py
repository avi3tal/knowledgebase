import math


def pow(A, B, C):
    """pow(x, n) % d"""
    res = 1 % C
    while B > 0:
        if B & 1:  # Odd
            res = (res * A) % C
        A = A**2 % C
        B >>= 1
    return res


# print(pow(2, 10, 1))
# print(5 & 1)


class Solution:
    # @param x : integer
    # @param n : integer
    # @param d : integer
    # @return an integer
    def pow(self, x, n, d):
        if n == 0:
            return 1 % d

        p = pow(x, n // 2, d)

        if n & 1:  # Odd
            ans = x * p *p
        else:
            ans = p *p
        return ans % d


s = Solution()
A = 71045970
B = 41535484
C = 64735492
print(s.pow(A, B, C))