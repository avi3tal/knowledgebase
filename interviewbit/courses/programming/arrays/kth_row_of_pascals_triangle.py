"""
Given an index k, return the kth row of the Pascal’s triangle.

Pascal’s triangle : To generate A[C] in row R, sum up A’[C] and A’[C-1] from previous row R - 1.

Example:

Input : k = 3

Return : [1,3,3,1]

"""


class Solution:
    # @param A : integer
    # @return a list of integers
    def getRow(self, A):
        if A == 0:
            return [1]
        line = [1]
        prev_line = self.getRow(A-1)
        for i in range(len(prev_line)-1):
            line.append(prev_line[i] + prev_line[i+1])
        line.append(1)
        return line


s = Solution()
print(s.getRow(3))
