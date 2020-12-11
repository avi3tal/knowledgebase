"""
Given a collection of numbers, return all possible permutations.

Example:

[1,2,3] will have the following permutations:

[1,2,3]
[1,3,2]
[2,1,3]
[2,3,1]
[3,1,2]
[3,2,1]
"""


class Solution:
    # @param A : list of integers
    # @return a list of list of integers
    def permute(self, A):
        if not A:
            return []
        if len(A) == 1:
            return [A]

        l = []
        for i in range(len(A)):
            m = A[i]

            rem_list = A[:i] + A[i+1:]
            for p in self.permute(rem_list):
                l.append([m] + p)
        return l


a = [1, 2, 3]
s = Solution()
print(s.permute([str(i) for i in a]))
