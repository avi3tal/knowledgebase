"""
https://leetcode.com/problems/reverse-integer/

Signed bit -> can be negative and positive interests where the first bit represent the direction
(0 -> positive , 1 -> negative ) and the rests are the absolute value of the integer
Unsigned int refers to positive integers only

popping numbers from the end without using stack
pop = x % 10
x = x / 10


reversing :
rev = 0
tmp = rev * 10 + pop
rev = tmp

in python we do not risk with int overflow because of the arbitrary precision meachanism
Python support short and long int
Short is identical to the C-style with fixed precision
But once we have a large number it automatically converted to be long which is arbitrary precision

Time: O(log(x))
Space: O(1)
"""


def reverse(x: int) -> int:
    rev = 0
    sign, x = x < 0, abs(x)
    while x:
        rev = rev * 10 + (x % 10)
        x = x // 10
    if rev > (2 ** 31) - 1 or rev < -2 ** 31:
        return 0
    return -rev if sign else rev


print(reverse(123))
print(reverse(-123))
