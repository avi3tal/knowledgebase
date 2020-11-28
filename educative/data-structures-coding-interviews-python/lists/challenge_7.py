"""
https://www.educative.io/courses/data-structures-coding-interviews-python/YQrnlJ3kx80

Given a list of size n, can you find the second maximum element in the list?
Implement a function find_second_maximum(lst) which returns the second largest element in the list.

"""


def find_second_maximum(lst):
    """
    finding two highest numbers and storing into a sorted list
    return tail

    assumption: all numbers are positive
    """
    highest_nums = [float('-inf'), float('-inf')]

    for i in lst:
        if i > highest_nums[1]:
            if i > highest_nums[0]:
                highest_nums[1] = highest_nums[0]
                highest_nums[0] = i
            elif i < highest_nums[0]:
                highest_nums[1] = i
    return highest_nums[1]


if __name__ == "__main__":
    assert find_second_maximum([9, 2, 3, 6]) == 6
    assert find_second_maximum([4, 2, 1, 5, 0]) == 4
    assert find_second_maximum([4, 2, 1, 5, 0, 5]) == 4
