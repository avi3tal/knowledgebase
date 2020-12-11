"""
https://www.youtube.com/watch?v=GuTPwotSdYw&list=RDCMUCnxhETjJtTPs37hOZ7vQ88g&index=1

Print all permutations of a given string

input: ABC
output:
ABC
ACB
BAC
BCA
CAB
CBA

notes:
There are n! permutations
the height of the tree will always be len(a)
"""


def permute(a, l, r):
    if l == r:
        print("".join(a))
    else:
        for i in range(l, r+1):
            a[l], a[i] = a[i], a[l]
            permute(a, l+1, r)
            a[l], a[i] = a[i], a[l]


s = "ABCDE"
n = len(s)
a = list(s)
permute(a, 0, n-1)


