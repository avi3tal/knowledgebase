"""
http://interactivepython.org/runestone/static/pythonds/BasicDS/ConvertingDecimalNumberstoBinaryNumbers.html

The original calculation is

decimal to bin:
12345
-> 1 x 10^4 + 2 x 10^3 + ... + 5 x 10^0

Hex to bin:
2E
->
"""


def convert_to_bin(number, base):
    hex = "0123456789ABCDEF"
    stack = []

    while number > 0:
        rem = number % base
        stack.append(rem)
        number = number // base
        print("rem {} number {}".format(rem, number))

    n = "".join([str(i) for i in reversed(stack)])
    if base != 2:
        n = convert_to_bin(int(n), 2)
    return n


if __name__ == "__main__":
    print(convert_to_bin(100, 16))
