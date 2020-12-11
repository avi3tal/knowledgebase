"""
https://www.youtube.com/watch?v=UflHuQj6MVA&list=RDCMUCnxhETjJtTPs37hOZ7vQ88g&index=2

https://www.geeksforgeeks.org/longest-palindrome-substring-set-1/
"""


def longest_palindromic_substring(s):
    n = len(s)
    table = [[0 for x in range(n)] for y in range(n)]
    # all strings of length 1 are palindrome
    start = 0
    max_len = 1
    for i in range(n):
        table[i][i] = 1

    for i in range(n-1):
        if s[i] == s[i+1]:
            table[i][i+1] = 1
            start = i
            max_len = 2

    for k in range(3, n):
        for i in range(n - k + 1):
            j = i + k - 1
            if table[i+1][j-1] and s[i] == s[j]:
                table[i][j] = 1
                if k > max_len:
                    max_len = k
                    start = i
    print(s[start:start+max_len])
    return max_len



longest_palindromic_substring("aaaabbaa")

