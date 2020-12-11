"""
https://leetcode.com/problems/palindrome-number

Time complexity = O(log n)
Space complexity = O(1)
"""


def is_palindrome(x):
    """
    :type x: int
    :rtype: bool
    """
    if x < 0:
        return False
    if x < 10:
        return True

    # arr = [n for n in str(x)]
    # while len(arr) > 1:
    #     a = arr.pop(0)
    #     b = arr.pop()
    #     if a != b:
    #         return False

    new = 0
    while x > new:
        new = new * 10 + x % 10
        x /= 10

    print(x)
    print(new)

    return x == new or x == new / 10


def is_str_palindrome(s):
    if len(s) == 1:
        return True
    if len(s) == 2:
        return s[0] == s[1]
    n = len(s)
    return s[0] == s[n-1] and is_str_palindrome(s[1:n-1])


if __name__ == "__main__":
    # print(is_palindrome(919919))
    print(is_str_palindrome("ABCDCBA"))
