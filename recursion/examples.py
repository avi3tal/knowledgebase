"""
driven by https://www.w3resource.com/python-exercises/data-structures-and-algorithms/python-recursion.php#EDITOR
"""


def cnums(numlist):
    """1. Write a Python program to calculate the sum of a list of numbers"""
    if len(numlist) == 1:
        return numlist[0]
    return numlist[0] + cnums(numlist[1:])

# print(cnums([1, 2, 3, 4]))



def to_string(num, base):
    """2. Write a Python program to converting an Integer to a string in any base"""
    convert_string = "0123456789ABCDEF"
    if num < base:
        return convert_string[num]
    else:
        print(num, num // base, num % base)
        return to_string(num // base, base) + convert_string[num % base]

# print(to_string(2835,16))


def csum2(numlist):
    """
    3. Write a Python program of recursion list sum. Go to the editor
    Test Data: [1, 2, [3,4], [5,6]]
    Expected Result: 21
    """
    if len(numlist) == 1:
        return numlist[0]
    if isinstance(numlist[0], list):
        return csum2(numlist[0]) + csum2(numlist[1:])
    else:
        return numlist[0] + csum2(numlist[1:])


print(csum2([1, 2, [3,4], [5,6]]))