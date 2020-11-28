"""
https://www.educative.io/courses/data-structures-coding-interviews-python/gx66VJRNY3Y
Given a list, can you rotate its elements by one index from right to left?

"""


def right_rotate(lst, n):
    normalized_jumps = n % len(lst)
    while normalized_jumps:
        move_element = lst.pop()
        lst.insert(0, move_element)
        normalized_jumps -= 1
    return lst


if __name__ == "__main__":
    # print(right_rotate([10, 20, 30, 40, 50], 3))
    assert right_rotate([10, 20, 30, 40, 50], 3) == [30, 40, 50, 10, 20]
