"""
Find a couple of numbers from a list of numbers to equal a given sum

Pre:
The candidate might give a bruteforce solution with O(n^n)

Phase 1:
Assume all integers
Assume ordered list
Try to find a linear solution O(n)

Phase 2:
Unordered list
Try to find a linear solution O(n)

Phase 3:
What if a given list is too big and doesn't fit in memory ?
"""


def phase1(l, sum):
    """
    instead of jumping from start to end, since this is an ordered list
    we place a pointer to the beginning of the list and another one to the end
    then, if the sum of both numbers is higher than "sum" we decrease the higher index by one
    if the sum is lower than "sum" we increase the starting index by one.
    Until lower index point to the same number as higher index

    complexity O(n)
    """
    i = 0
    j = len(l) - 1

    while i < j:
        print("calc {} + {}".format(l[i], l[j]))
        s = l[i] + l[j]
        print("given ", s)
        if s == sum:
            return True
        elif s > sum:
            j -= 1
        else:
            i += 1

    return False


def phase2(l, sum):
    """
    Since we no longer assume an ordered list, the classic solution would be to
    calculate the diff on each element and save into memory.
    Than ask if we already seen a desired diff in the past, in case we did, return True

    Complexity O(n)
    """
    m = set()

    for element in l:
        diff = sum - element
        if diff in m:
            print("found diff {} for elemnt {}".format(diff, element))
            return True
        else:
            print("checking element {} adding {} to m>{}".format(element, diff, m))
            m.add(diff)
    return False


def phase3(l, sum):
    """
    This is much complex. The solution would be breaking the given list into chunks and start running phase2 on each one.
    Then merge the results and make verify
    """
    pass


if __name__ == "__main__":
    sum = 8
    good = [1, 2, 3, 4, 4, 9]
    bad = [1, 2, 3, 4, 9]
    print phase1(good, sum)
    print phase2(good, sum)
