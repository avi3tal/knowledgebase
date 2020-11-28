def sqrt(num):
    """
    Find the Square Root on integer without using internal sqrt
    :param num: integer
    :return: floor(sqrt(num))
    """

    if num < 2:
        return num

    result = 0
    start, end = 1, num // 2
    while start <= end:
        mid = (start + end) // 2
        sqr = mid ** 2
        # print(start, end, mid)
        if sqr == num:
            return mid
        if sqr > num:
            end = mid - 1
        else:
            start = mid + 1
            result = mid

    return result


print(sqrt(100))
