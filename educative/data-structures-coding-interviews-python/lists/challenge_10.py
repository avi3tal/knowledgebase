"""
Arrange elements in such a way that the maximum element appears at first position,
then minimum at second, then second maximum at third and second minimum at fourth and so on.

Implement a function called maxMin(lst) which will re-arrange the elements of a sorted list
such that the 0th index will have the largest number, the 1st index will have the smallest,
and the third index will have second-largest, and so on. In other words, all the odd-numbered
indices will have the largest numbers in the list in descending order and the even-numbered
indices will have the smallest numbers in ascending order.
"""


def max_min_rec(lst, pos):
    print(pos, len(lst), lst)
    if pos < len(lst):
        item = lst.pop()
        lst.insert(pos, item)
        max_min_rec(lst, pos+2)


def max_min(lst):
    max_min_rec(lst, 0)
    return lst


if __name__ == "__main__":
    assert max_min([1,2,3,4,5]) == [5,1,4,2,3]