"""
Find longest common ss

O(m*n)
"""


def lcss(s1, s2, m, n):
    table = [[0 for _ in range(n+1)] for _ in range(m+1)]

    result = 0
    for i in range(m+1):
        for j in range(n+1):
            if s1[i-1] == s2[j-1]:
                table[i][j] = table[i-1][j-1] + 1
                result = max(result, table[i][j])
            else:
                table[i][j] = 0

    # for r in table:
    #     print(r)

    return result


x = "sparkbeyond"
y = "abcspsparkbaaspareyondfoo"

print(lcss(x, y, len(x), len(y)))

