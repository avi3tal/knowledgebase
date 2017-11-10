"""
http://practice.geeksforgeeks.org/problems/subarray-with-given-sum/0

Example:
Input:
2
5 12
1 2 3 7 5
10 15
1 2 3 4 5 6 7 8 9 10

Output:
2 4
1 5
"""


def find_sub_array_with_given_sum(arr, expected_sum):
    added = dict()
    sum = 0

    for i in range(0, len(arr)):
        if sum > expected_sum:
            sum -= added.pop(min(added.keys()))
        elif sum < expected_sum:
            sum += arr[i]
            added[i+1] = arr[i]

        if sum == expected_sum:
            # compatible with py36
            return "{} {}".format(min(list(added.keys())), max(list(added.keys())))

    return -1


def main():
    # first line contain one integer: T = number of tests
    # second line contains two integers: N = number of elements in array, S = sum of sub-array

    t = int(input("Enter number of tests: "))
    res = dict()

    for i in range(1, t+1):
        n, s = map(lambda x: int(x), raw_input("Enter Number of elements and Sum expected: ").split(" "))
        arr = map(lambda x: int(x), raw_input("Enter int array: ").split(" "))

        res[i] = find_sub_array_with_given_sum(arr, s)

    for k, v in res.iteritems():
        print("arr number {} is {}".format(k, v))


if __name__ == "__main__":
    main()
