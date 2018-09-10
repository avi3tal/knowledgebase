"""
Convert an integer to string on any base
2, 8, 10, 16

>>> to_str(30, 16)
"""


def to_str(n, base):
    convertString = '0123456789ABCDEF'
    if n <= base:
        return convertString[n]
    else:
        return to_str(n//base, base) + to_str(n % base, base)


if __name__ == "__main__":
    print(to_str(16221, 2))
