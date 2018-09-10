"""
Factorial of a number

e.g. 4! = 4*3*2*1
"""


def factorial_of_number(num):
    if num > 0:
        return num * factorial_of_number(num - 1)
    else:
        return 1


if __name__ == "__main__":
    print(factorial_of_number(5))
