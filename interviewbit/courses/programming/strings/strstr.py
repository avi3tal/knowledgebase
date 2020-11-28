class Solution:
    # @param A : string
    # @param B : string
    # @return an integer
    def strStr(self, A, B):
        alen = len(A)
        blen = len(B)
        if blen > alen:
            return -1
        if blen == alen:
            if A == B:
                return 0
            return -1

        bmap = {}
        for i, v in enumerate(B):
            if v in bmap:
                bmap[v].append(i)
            else:
                bmap[v] = [i]

        for i in range(blen-1, alen-1, blen):
            # print(i, A[i])
            if A[i] in bmap:
                for j in bmap[A[i]]:
                    if B == A[i-j:i-j+blen]:
                        return i-j

        return -1




s = Solution()
# print(s.strStr("aslkdfnlskdfnavitalsdfksdl", "avital"))
# print(s.strStr("avitalaslkdfnlskdfnsdfksdl", "avital"))
# print(s.strStr("aslkdfnlskdfnsdfksdlavital", "avital"))
print(s.strStr("abaaabbaaabaaaabbbbaabbabaabaaabbbaaaaabbaaaaabbbabbbaaabaaaabaaaaa", "aaabbabbaababaaababbabbaaabbbbbabbbaabbbaabaaaababbbaababbabbbbaaab"))