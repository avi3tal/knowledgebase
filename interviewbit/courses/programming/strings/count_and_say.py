"""
The count-and-say sequence is the sequence of integers beginning as follows:

1, 11, 21, 1211, 111221, ...

1 is read off as one 1 or 11.
11 is read off as two 1s or 21.
21 is read off as one 2, then one 1 or 1211.

Given an integer n, generate the nth sequence.
Note: The sequence of integers will be represented as a string.

Example:

if n = 2,
the sequence is 11.
"""


class Solution:
    def predic_next(self, prev):
        res = ""
        cnt = 1
        last = prev[0]
        for i in prev[1:]:
            if i != last:
                res += f"{cnt}{last}"
                cnt = 1
                last = i
            else:
                cnt += 1
        res += f"{cnt}{last}"

        return res

    # @param A : integer
    # @return a strings
    def countAndSay(self, A):
        num = "1"
        if A == 1:
            return num
        for i in range(A):
            num = self.predic_next(num)

        return num




s = Solution()
print(s.countAndSay(10))