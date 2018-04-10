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


if __name__ == "__main__":
    print(is_palindrome(919919))
