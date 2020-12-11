
def lps(s):
    n = len(s)
    table = [[0 for i in range(n)] for j in range(n)]

    start = 0
    max_len = 1
    # define single char as palindrome
    for i in range(n):
        table[i][i] = 1

    # find couple chars as palindrome
    for i in range(n-1):
        if s[i] == s[i+1]:
            table[i][i+1] = 1
            max_len = 2
            start = i

    # find 3+ chars as palindrome
    for k in range(3, n):
        for i in range(n-k+1):
            j = i+k-1
            if table[i+1][j-1] and s[i] == s[j]:
                table[i][j] = 1
                if k > max_len:
                    max_len = k
                    start = i
    print(s[start:start+max_len])
    return max_len


if __name__ == "__main__":
    X = "aaaabbaa"
    print(lps(X))
