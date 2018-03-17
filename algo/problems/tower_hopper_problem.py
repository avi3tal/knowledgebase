"""

Well describe in https://www.youtube.com/watch?v=kHWy5nEfRIQ

There are two potential ways of solving this problem
Graph approach
or
Dynamic programming / recursive approach
"""


# My native solution
def next_step(current, towers):
    """
    The following algorithm will try to identify the next best step
    :param current:
    :param towers:
    :return:
    """
    print(">>>> {}->{} of {}".format(current, towers[current], towers))

    # check if the next jump already capable for passing the entire list
    if current + towers[current] >= len(towers):
        return current + towers[current]

    # create a new sub list from the current -> farest jump by current value
    sub = towers[current + 1: current + towers[current] + 1]
    # create new list calculating each entity with the position and value
    options = []
    for i, v in enumerate(sub):
        if v == 0:
            options.append(v)
        else:
            options.append(v + i)

    # if new list is not empty calculate the new current by adding the max value position to the current position
    if options:
        sub_next = options.index(max(options))
        current += sub_next + 1

    print("sub {} options {} best {}".format(sub, options, current))
    return current


def is_happable(towers):
    """
    Check if a given seq can be hap till user in position 0 will be able to jump outside the seq
    :param towers: list of integers describes set of towers
    :return: Boolean
    """

    # assumptions: List can't be empty or start with zero
    if len(towers) == 0 or towers[0] == 0:
        return False

    print("Testing {}".format(towers))
    current = 0
    while True:
        if current >= len(towers):
            return True
        if towers[current] == 0:
            return False
        current = next_step(current, towers)


# Graph approach
# BFS
# DFS



# Dynamic programming



# simpale approach (by author in vidio)



if __name__ == "__main__":
    # seq = [4, 2, 0, 0, 2, 0]
    # seq = [1, 0]
    # seq = [4, 2, 0, 0, 2, 0, 7, 0, 3, 1, 0]
    # seq = [4, 2, 0, 0, 2, 0, 2, 0, 3, 1, 0]
    # seq = [4, 2, 0, 0, 2, 0, 2, 0, 1, 1, 0]
    seq = [4, 2, 0, 0, 1, 0]


    # length is 6
    # 4 + subarray  [2, 0, 0, 4]
    # start calculate from the end
    print is_happable(seq)
