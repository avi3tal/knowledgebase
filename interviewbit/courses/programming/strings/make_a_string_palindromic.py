class Solution:
    def __solve_rec(self, s, m, n):
        if m > n: return -1
        if m == n: return 0
        if m == n - 1:
            if s[m] == s[n]:  # aa
                return 0
            else:  # ab -> aba
                return 1

        if s[m] == s[n]:
            return self.__solve_rec(s, m + 1, n - 1)
        else:
            return min(self.__solve_rec(s, m, n - 1), self.__solve_rec(s, m + 1, n)) + 1

    # @param A : string
    # @return an integer
    def solve(self, A):
        return self.__solve_rec(A, 0, len(A) - 1)




s = Solution()
print(s.solve("banana"))