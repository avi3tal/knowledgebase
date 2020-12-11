def lcss(s1, s2, n, m):
    table = [[0 for i in range(m+1)] for j in range(n+1)]
    result = 0

    for i in range(n+1):
        for j in range(m+1):
            if i == 0 or j == 0:
                table[i][j] = 0
            elif s1[i] == s2[j]:
                table[i][j] = table[i-1][j-1] + 1
                result = max(result, table[i][j])
            else:
                table[i][j] = 0
    return result


x = "sparkbeyond"
y = "abcspsparkbaaspareyondfoo"
print(x, y, len(x), len(y))