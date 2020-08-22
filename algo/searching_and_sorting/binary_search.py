

def binary_search(search_num, sorted_arr):
    """
    https://runestone.academy/runestone/books/published/pythonds/SortSearch/TheBinarySearch.html
    First Q at https://dev.to/javinpaul/20-basic-algorithms-problems-from-coding-interviews-4o76
    """
    if sorted_arr[0] == search_num:
        return True
    arr_len = len(sorted_arr)

    if arr_len > 1:
        if sorted_arr[arr_len - 1] == search_num:
            return True

    mid_value = sorted_arr[abs(arr_len / 2)]

    if arr_len <= 2:
        return False

    if mid_value == search_num:
        return True

    if mid_value < search_num:
        return binary_search(search_num, sorted_arr[mid_value:])
    if mid_value > search_num:
        return binary_search(search_num, sorted_arr[:mid_value ])


def binary_search_no_rec(search_num, sorted_arr):
    first = 0
    last = len(sorted_arr) - 1
    found = False

    while first <= last and not found:
        midpoint = (first + last) // 2
        print(midpoint, sorted_arr[midpoint], sorted_arr[first: last])
        if sorted_arr[midpoint] == search_num:
            found = True
        else:
            if sorted_arr[midpoint] > search_num:
                last = midpoint - 1
            else:
                first = midpoint + 1
    return found


if __name__ == "__main__":
    arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    print(binary_search_no_rec(5, arr))

